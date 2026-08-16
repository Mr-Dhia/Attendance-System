const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const WorkSchedule = require("../models/WorkSchedule");
const pendingFingerprint = require("../utils/pendingFingerprint");
const pendingDeletions = require("../utils/pendingDeletions");
const createNotification = require("../utils/createNotification");

function heureActuelle() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMins) {
  const normalized = (totalMins + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, "0");
  const m = String(normalized % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function debutJour(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finJour(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

exports.handleFingerprint = async (req, res) => {
  try {
    const { action, employeeId } = req.body;
    const rawFingerID = req.body.fingerID !== undefined ? req.body.fingerID : req.body.id;
    const fingerID = rawFingerID !== undefined ? Number(rawFingerID) : undefined;

    if (!action) {
      return res.status(400).json({ error: "action requise" });
    }

    if (action !== "deleteEmployee" && (fingerID === undefined || isNaN(fingerID))) {
      return res.status(400).json({ error: "fingerID et action requis" });
    }

    if (action === "recognize") {
      const employee = await Employee.findOne({ fingerIDs: fingerID });

      if (!employee) {
        return res.status(404).json({ id: "inconnu" });
      }

      const today = new Date();

      // VÉRIFICATION DU CONTRAT : Un employé hors contrat ne peut pas pointer
      if (employee.statut === "Inactif") {
        return res.status(400).json({ name: employee.name, error: "Pointage refusé : Employé inactif." });
      }

      const todayStart = debutJour(today);
      const todayEnd = finJour(today);

      if (employee.scheduleStartDate) {
        const sStart = debutJour(employee.scheduleStartDate);
        if (todayStart < sStart) {
          return res.status(400).json({ name: employee.name, error: "Pointage refusé : Employé hors contrat." });
        }
      }

      if (employee.scheduleEndDate) {
        const sEnd = finJour(employee.scheduleEndDate);
        if (todayEnd > sEnd) {
          return res.status(400).json({ name: employee.name, error: "Pointage refusé : Employé hors contrat." });
        }
      }

      const dayIndex = today.getDay(); // 0: Dimanche, 1: Lundi, Samedi...
      const heure = heureActuelle();
      const currentMinutes = timeToMinutes(heure);

      // Charger le régime d'horaires attribué à cet employé (avec résolution à 4 niveaux)
      const WeeklyAssignment = require("../models/WeeklyAssignment");
      
      // 1. Chercher l'affectation active (Semaine en cours ou héritée des semaines précédentes)
      const weeklyAssignment = await WeeklyAssignment.findOne({
        weekStartDate: { $lte: today },
        employees: employee._id,
      }).sort({ weekStartDate: -1 }).populate("workSchedule");

      let userSchedule = weeklyAssignment ? weeklyAssignment.workSchedule : null;

      if (!userSchedule) {
        return res.status(400).json({
          name: employee.name,
          error: "Pointage refusé : Non affectation cette semaine.",
        });
      }

      const todayConfig = userSchedule.jours?.find((j) => j.jourIndex === dayIndex);

      // 2. RÈGLE : Aucun pointage si le jour n'est pas un jour ouvré / travaillé
      if (!todayConfig || !todayConfig.estJourOuvre) {
        return res.status(400).json({
          name: employee.name,
          error: "Pointage refusé : Jour non travaillé (repos).",
        });
      }

      const heureDebutMins = timeToMinutes(todayConfig.heureDebut || "08:00");
      const heureFinMins = timeToMinutes(todayConfig.heureFin || "17:00");

      // Heures de début et de fin de pointage autorisées définies par l'Admin pour cet horaire :
      const debutPointageMins = todayConfig.heureDebutPointage 
        ? timeToMinutes(todayConfig.heureDebutPointage) 
        : (heureDebutMins - 15);

      const finPointageMins = todayConfig.heureFinPointage 
        ? timeToMinutes(todayConfig.heureFinPointage) 
        : (heureFinMins + 30);

      const isNightShift = (heureFinMins < heureDebutMins) || (finPointageMins < debutPointageMins);

      // Détecter si un service commencé hier se poursuit après minuit
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let log = await Attendance.findOne({
        employee: employee._id,
        date: { $gte: debutJour(yesterday), $lte: finJour(yesterday) },
      });

      let isContinuingYesterdayShift = false;
      if (log && log.pointages && log.pointages.length > 0) {
        const dernierPointage = log.pointages[log.pointages.length - 1];
        if (dernierPointage.type === "entree") {
          isContinuingYesterdayShift = true;
        }
      }

      // 3. RÈGLE : Aucun pointage en dehors des heures autorisées définies par l'administrateur
      // Ce contrôle ne s'applique qu'à la PREMIÈRE entrée de la journée (entrée initiale).
      // Les retours de pause ou sorties intermédiaires ne sont pas bloqués par cette règle.
      const logExistantAujourdhui = await Attendance.findOne({
        employee: employee._id,
        date: { $gte: debutJour(today), $lte: finJour(today) },
      });

      // RÈGLE ABSOLUE : Après un pointage de "Fin de Service" ou une sortie finale,
      // le service du jour est terminé. Tout pointage ultérieur sur la borne est refusé !
      if (logExistantAujourdhui && logExistantAujourdhui.pointages && logExistantAujourdhui.pointages.length > 0) {
        const pointages = logExistantAujourdhui.pointages;
        const dernierP = pointages[pointages.length - 1];

        const estFinDeServiceEffective = pointages.some(
          (p) => p.label === "Sortie Fin de Service" || p.label === "Fin de Service"
        ) || (dernierP && dernierP.type === "sortie" && (dernierP.label === "Sortie Fin de Service" || dernierP.label === "Fin de Service" || pointages.length >= 2));

        if (estFinDeServiceEffective) {
          return res.status(400).json({
            name: employee.name,
            error: "Pointage refusé : Service déjà terminé aujourd'hui.",
          });
        }
      }

      const estRetourPause = logExistantAujourdhui && logExistantAujourdhui.pointages && logExistantAujourdhui.pointages.length > 0;

      if (!isContinuingYesterdayShift && !estRetourPause) {
        const minTxt = todayConfig.heureDebutPointage || minutesToTime(debutPointageMins);
        const maxTxt = todayConfig.heureFinPointage || minutesToTime(finPointageMins);

        const crossesMidnight = finPointageMins < debutPointageMins;

        if (!crossesMidnight) {
          if (currentMinutes < debutPointageMins) {
            return res.status(400).json({
              name: employee.name,
              error: `Pointage refusé : Trop tôt (autorisation dès ${minTxt}).`,
            });
          }

          if (currentMinutes > finPointageMins) {
            return res.status(400).json({
              name: employee.name,
              error: `Pointage refusé : Heure de fin de pointage dépassée (${maxTxt}).`,
            });
          }
        } else {
          const estDansPlageNuit = (currentMinutes >= debutPointageMins) || (currentMinutes <= finPointageMins);

          if (!estDansPlageNuit) {
            const diffFin = currentMinutes - finPointageMins;
            const diffDebut = debutPointageMins - currentMinutes;

            if (diffFin < diffDebut) {
              return res.status(400).json({
                name: employee.name,
                error: `Pointage refusé : Heure de fin de pointage dépassée (${maxTxt}).`,
              });
            } else {
              return res.status(400).json({
                name: employee.name,
                error: `Pointage refusé : Trop tôt (autorisation dès ${minTxt}).`,
              });
            }
          }
        }
      }

      log = logExistantAujourdhui;

      let typePointage = "entree";
      let pointageLabel = "";
      let responseMsg = "";
      let statutEnvoi = ""; // Règle : aucun statut "Retard" ou "À l'heure" transmis sur les sorties

      const debutPauseMins = timeToMinutes(todayConfig.heureDebutPause || "12:00");
      const finPauseMins = timeToMinutes(todayConfig.heureFinPause || "13:00");
      const tolerencePause = todayConfig.tolerenceRetardPause !== undefined ? Number(todayConfig.tolerenceRetardPause) : 5;
      const maxPauseCigaretteMins = todayConfig.dureePauseCigaretteMax !== undefined ? Number(todayConfig.dureePauseCigaretteMax) : 10;

      if (!log || !log.pointages || log.pointages.length === 0) {
        // --- 1. ENTRÉE DÉBUT SERVICE ---
        typePointage = "entree";
        pointageLabel = "Entrée Début Service";

        const tolerenceEntree = todayConfig.tolerenceRetardEntree !== undefined ? Number(todayConfig.tolerenceRetardEntree) : 5;
        const diffMins = currentMinutes - heureDebutMins;
        const estEnRetard = diffMins > tolerenceEntree;
        const minutesRetard = estEnRetard ? diffMins : 0;
        const statut = estEnRetard ? "Retard" : "À l'heure";
        statutEnvoi = statut;
        responseMsg = estEnRetard ? `Entrée (Retard ${minutesRetard} min)` : "Entrée Début Service";

        if (log) {
          log.statut = statut;
          log.retardMins = minutesRetard;
          log.retardPauseMins = 0;
          log.pointages = [{ heure, type: typePointage, label: pointageLabel }];
          await log.save();
        } else {
          log = await Attendance.create({
            employee: employee._id,
            date: today,
            statut,
            retardMins: minutesRetard,
            retardPauseMins: 0,
            pointages: [{ heure, type: typePointage, label: pointageLabel }],
          });
        }

        await createNotification(
          employee._id,
          statut === "Retard" ? "retard" : "presence",
          statut === "Retard"
            ? `${employee.name} est arrivé en retard (${heure})`
            : `${employee.name} a commencé son service (${heure})`
        );
      } else {
        const dernier = log.pointages[log.pointages.length - 1];
        typePointage = dernier.type === "entree" ? "sortie" : "entree";

        if (typePointage === "sortie") {
          // --- SORTIES : RÈGLE ABSOLUE -> PAS DE STATUT "RETARD" OU "À L'HEURE" SUR LES SORTIES ---
          statutEnvoi = "";

          const margeFinServiceMins = todayConfig.margeFinService !== undefined ? Number(todayConfig.margeFinService) : 35;
          const estPendantPlageRepas = currentMinutes >= (debutPauseMins - 30) && currentMinutes <= finPauseMins;
          const estProcheFinService = !isNightShift
            ? (currentMinutes >= (heureFinMins - margeFinServiceMins))
            : (currentMinutes >= (heureFinMins - margeFinServiceMins) || currentMinutes <= 30);

          if (estProcheFinService) {
            pointageLabel = "Sortie Fin de Service";
            responseMsg = "Sortie Fin de Service";
          } else if (estPendantPlageRepas) {
            pointageLabel = "Sortie Repas";
            responseMsg = "Sortie Repas";
          } else {
            pointageLabel = "Sortie Pause";
            responseMsg = "Sortie Pause";
          }

          log.pointages.push({ heure, type: typePointage, label: pointageLabel });
          await log.save();

          await createNotification(
            employee._id,
            "presence",
            `${employee.name} : ${pointageLabel} (${heure})`
          );
        } else {
          // --- ENTRÉES DE PAUSE / REPAS ---
          // Entrée Repas : UNIQUEMENT si la sortie précédente était "Sortie Repas" ET pendant le créneau du repas (+45 min)
          const dernierSortieLabel = dernier ? dernier.label : "";
          const estRetourRepas = (dernierSortieLabel === "Sortie Repas") && (currentMinutes <= (finPauseMins + 45));

          if (estRetourRepas) {
            pointageLabel = "Entrée Repas";
            responseMsg = "Entrée Repas";

            const depassementPauseMins = currentMinutes - (finPauseMins + tolerencePause);
            if (depassementPauseMins > 0) {
              const netRetardPause = currentMinutes - finPauseMins;
              log.retardPauseMins = (log.retardPauseMins || 0) + netRetardPause;
              statutEnvoi = "";
              responseMsg = `Entrée Repas (Retard ${netRetardPause} min)`;
              await createNotification(
                employee._id,
                "retard",
                `Retard repas : ${employee.name} a repris le travail à ${heure} (retard de ${netRetardPause} min).`
              );
            } else {
              statutEnvoi = "";
            }
          } else {
            pointageLabel = "Entrée Pause";
            responseMsg = "Entrée Pause";

            const sortiesList = log.pointages.filter((p) => p.type === "sortie");
            const derniereSortie = sortiesList.length > 0 ? sortiesList[sortiesList.length - 1] : null;
            let dureePauseMins = 0;
            if (derniereSortie) {
              const sMins = timeToMinutes(derniereSortie.heure);
              dureePauseMins = currentMinutes >= sMins ? (currentMinutes - sMins) : (currentMinutes + 1440 - sMins);
            }

            if (dureePauseMins > maxPauseCigaretteMins) {
              const retardCigarette = dureePauseMins - maxPauseCigaretteMins;
              log.retardPauseMins = (log.retardPauseMins || 0) + retardCigarette;
              statutEnvoi = "";
              responseMsg = `Entrée Pause (Dépassement ${retardCigarette} min)`;
              await createNotification(
                employee._id,
                "retard",
                `Dépassement pause : ${employee.name} pause de ${dureePauseMins} min (max ${maxPauseCigaretteMins} min).`
              );
            } else {
              statutEnvoi = "";
            }
          }

          log.pointages.push({ heure, type: typePointage, label: pointageLabel });
          await log.save();
        }
      }

      return res.json({
        id: employee._id.toString(),
        name: employee.name,
        type: typePointage,
        label: pointageLabel,
        heure,
        statut: statutEnvoi,
        message: responseMsg,
      });
    }

    if (action === "enroll") {
      const { employeeId } = req.body;
      const targetId = employeeId || pendingFingerprint.get();

      if (targetId) {
        try {
          const employee = await Employee.findByIdAndUpdate(
            targetId,
            { $addToSet: { fingerIDs: fingerID } },
            { new: true }
          );
          if (!employeeId) pendingFingerprint.clear();

          if (employee) {
            await createNotification(employee._id, "empreinte", `Empreinte associée à ${employee.name}`);
            return res.json({ id: employee._id.toString(), name: employee.name, type: "associe" });
          }
        } catch (err) {
          if (err.code === 11000) {
            return res.status(409).json({ id: "deja_associe", error: "Cette empreinte appartient deja a un autre employe" });
          }
          throw err;
        }
      }

      console.log(`Nouveau fingerID sans employe cible : ${fingerID}`);
      return res.json({ id: "en_attente_association", fingerID });
    }

    if (action === "delete") {
      const fid = Number(fingerID);
      const employee = await Employee.findOneAndUpdate(
        { fingerIDs: fid },
        { $pull: { fingerIDs: fid } }
      );

      if (!employee) {
        console.log(`[fingerprint delete] Aucun employe associe au fingerID ${fid}`);
      }

      return res.json({
        id: employee ? "dissocie" : "aucun_employe_lie",
      });
    }

    if (action === "deleteEmployee") {
      if (!employeeId) {
        return res.status(400).json({ error: "employeeId requis" });
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employe introuvable" });
      }

      if (employee.fingerIDs && employee.fingerIDs.length > 0) {
        employee.fingerIDs.forEach(fid => pendingDeletions.add(fid));
      }

      await Employee.findByIdAndDelete(employeeId);

      return res.json({ id: "employe_supprime" });
    }

    return res.status(400).json({ error: "action inconnue" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingDeletions = (req, res) => {
  const fingerIDs = pendingDeletions.drain();
  res.json({ fingerIDs });
};

exports.checkPending = (req, res) => {
  const pendingId = pendingFingerprint.get();
  res.json({ pending: !!pendingId });
};

exports.getUnassignedEmployees = async (req, res) => {
  const { type } = req.query;

  let filtre = type === "toutes" ? {} : { creeRapide: { $ne: true } };
  if (type === "none") {
    filtre = { ...filtre, $or: [{ fingerIDs: { $exists: false } }, { fingerIDs: { $size: 0 } }] };
  } else if (type === "has") {
    filtre = { ...filtre, fingerIDs: { $exists: true, $not: { $size: 0 } } };
  }

  const employees = await Employee.find(filtre, "name matricule fingerIDs");
  res.json(employees.map(e => ({
    id: e._id.toString(),
    name: e.name,
    matricule: e.matricule,
    fingerCount: e.fingerIDs ? e.fingerIDs.length : 0,
  })));
};