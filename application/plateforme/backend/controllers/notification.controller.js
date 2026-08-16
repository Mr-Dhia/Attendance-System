const Notification = require("../models/Notification");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const WeeklyAssignment = require("../models/WeeklyAssignment");
const WorkSchedule = require("../models/WorkSchedule");

const HEURE_LIMITE_ABSENCE = "10:00";

function debutJour(date = new Date()) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function finJour(date = new Date()) { const d = new Date(date); d.setHours(23,59,59,999); return d; }

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMins) {
  const normalized = (totalMins + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, "0");
  const m = String(normalized % 60).padStart(2, "0");
  return `${h}:${m}`;
}

async function isEmployeeWorkingToday(emp, now = new Date()) {
  // Un employé inactif ou incomplet (créé rapidement en attente de complétion) ne travaille pas
  if (!emp || emp.statut === "Inactif" || emp.creeRapide) return false;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // 1. Contrôle des dates de contrat
  if (emp.scheduleStartDate) {
    const sStart = new Date(emp.scheduleStartDate);
    sStart.setHours(0, 0, 0, 0);
    if (today < sStart) return false;
  }

  if (emp.scheduleEndDate) {
    const sEnd = new Date(emp.scheduleEndDate);
    sEnd.setHours(23, 59, 59, 999);
    if (today > sEnd) return false; // Contrat expiré !
  }

  // 2. Contrôle de l'affectation de l'horaire pour cette semaine (ou héritée)
  const weeklyAssignment = await WeeklyAssignment.findOne({
    weekStartDate: { $lte: today },
    employees: emp._id,
  }).sort({ weekStartDate: -1 }).populate("workSchedule");

  let userSchedule = weeklyAssignment ? weeklyAssignment.workSchedule : null;
  if (!userSchedule && emp.workSchedule) {
    userSchedule = await WorkSchedule.findById(emp.workSchedule);
  }

  // Si l'employé n'est affecté à AUCUN horaire (ni hebdomadaire ni fixe), il ne travaille pas
  if (!userSchedule) {
    return false;
  }

  // 3. Contrôle du jour ouvré
  const dayIndex = now.getDay();
  const todayConfig = userSchedule.jours?.find((j) => j.jourIndex === dayIndex);
  if (!todayConfig || !todayConfig.estJourOuvre) {
    return false;
  }

  return true;
}

async function checkOubliFinDeService(now = new Date()) {
  try {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const employes = await Employee.find({ statut: "Actif" });

    for (const emp of employes) {
      const shouldBeWorking = await isEmployeeWorkingToday(emp, now);
      if (!shouldBeWorking) {
        // Nettoyage de toute fausse notification d'oubli de fin de service créée pour aujourd'hui
        await Notification.deleteMany({
          employee: emp._id,
          type: "oubli_fin_service",
          createdAt: { $gte: debutJour(now), $lte: finJour(now) },
        });
        continue;
      }

      const dateObj = new Date(now);
      const dayIndex = dateObj.getDay();

      const weeklyAssignment = await WeeklyAssignment.findOne({
        weekStartDate: { $lte: dateObj },
        employees: emp._id,
      }).sort({ weekStartDate: -1 }).populate("workSchedule");

      let userSchedule = weeklyAssignment ? weeklyAssignment.workSchedule : null;
      if (!userSchedule && emp.workSchedule) {
        userSchedule = await WorkSchedule.findById(emp.workSchedule);
      }
      if (!userSchedule) continue;

      const todayConfig = userSchedule.jours?.find((j) => j.jourIndex === dayIndex);
      if (!todayConfig || !todayConfig.estJourOuvre || !todayConfig.heureFin) continue;

      const heureDebutMins = timeToMinutes(todayConfig.heureDebut || "08:00");
      const [hFin, mFin] = todayConfig.heureFin.split(":").map(Number);
      const heureFinMins = (hFin || 0) * 60 + (mFin || 0);

      const delaiNotifMins = todayConfig.delaiNotificationOubliFinService !== undefined ? Number(todayConfig.delaiNotificationOubliFinService) : 15;

      const isNightShift = (heureFinMins < heureDebutMins);

      let estFinDeServiceDepasse = false;
      if (!isNightShift) {
        estFinDeServiceDepasse = currentMinutes > (heureFinMins + delaiNotifMins);
      } else {
        // Horaire de nuit / après-midi traversant minuit (ex: début 17:00, fin 01:00 le lendemain)
        // La fin de service (01:00) est dépassée uniquement le lendemain matin après 01:00 (+delai) et avant le début du service suivant
        estFinDeServiceDepasse = (currentMinutes > (heureFinMins + delaiNotifMins)) && (currentMinutes < heureDebutMins);
      }

      // Si l'heure courante a dépassé la fin de service effective (+ delaiNotifMins minutes)
      if (estFinDeServiceDepasse) {
        const presence = await Attendance.findOne({
          employee: emp._id,
          date: { $gte: debutJour(now), $lte: finJour(now) },
        });

        if (presence && presence.pointages && presence.pointages.length > 0) {
          const hasFinDeService = presence.pointages.some(
            (p) => p.label === "Sortie Fin de Service" || p.label === "Fin de Service"
          );

          if (!hasFinDeService) {
            const dejaNotifie = await Notification.findOne({
              employee: emp._id,
              type: "oubli_fin_service",
              createdAt: { $gte: debutJour(now), $lte: finJour(now) },
            });

            if (!dejaNotifie) {
              await Notification.create({
                employee: emp._id,
                type: "oubli_fin_service",
                message: `Oubli de pointage : ${emp.name} n'a pas pointé sa Fin de Service (${todayConfig.heureFin}). Cliquez pour l'ajouter.`,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Erreur checkOubliFinDeService:", err.message);
  }
}

async function checkAbsencesAutomatiques(now = new Date()) {
  try {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const employes = await Employee.find({ statut: "Actif" });

    for (const emp of employes) {
      const shouldBeWorking = await isEmployeeWorkingToday(emp, now);
      if (!shouldBeWorking) {
        // Nettoyage automatique des fausses absences (sans pointage réel) et fausses notifications
        await Attendance.deleteMany({
          employee: emp._id,
          date: { $gte: debutJour(now), $lte: finJour(now) },
          statut: "Absent",
          $or: [{ pointages: { $exists: false } }, { pointages: { $size: 0 } }],
        });
        await Notification.deleteMany({
          employee: emp._id,
          type: "absence",
          createdAt: { $gte: debutJour(now), $lte: finJour(now) },
        });
        continue;
      }

      const dateObj = new Date(now);
      const dayIndex = dateObj.getDay();

      const weeklyAssignment = await WeeklyAssignment.findOne({
        weekStartDate: { $lte: dateObj },
        employees: emp._id,
      }).sort({ weekStartDate: -1 }).populate("workSchedule");

      let userSchedule = weeklyAssignment ? weeklyAssignment.workSchedule : null;
      if (!userSchedule && emp.workSchedule) {
        userSchedule = await WorkSchedule.findById(emp.workSchedule);
      }
      if (!userSchedule) continue;

      const todayConfig = userSchedule.jours?.find((j) => j.jourIndex === dayIndex);
      if (!todayConfig || !todayConfig.estJourOuvre) continue;

      const heureDebutMins = timeToMinutes(todayConfig.heureDebut || "08:00");
      const heureFinMins = timeToMinutes(todayConfig.heureFin || "17:00");

      const debutPointageMins = todayConfig.heureDebutPointage 
        ? timeToMinutes(todayConfig.heureDebutPointage) 
        : (heureDebutMins - 15);
      const finPointageMins = todayConfig.heureFinPointage 
        ? timeToMinutes(todayConfig.heureFinPointage) 
        : (heureFinMins + 30);

      const crossesMidnight = finPointageMins < debutPointageMins;

      let aDepasseLimite = false;
      if (!crossesMidnight) {
        // Fenêtre sur le même jour (ex: debutPointage 16:30, finPointage 18:00)
        aDepasseLimite = currentMinutes > finPointageMins;
      } else {
        // Fenêtre traversant minuit (ex: début 16:30, finPointage 02:00 le lendemain)
        aDepasseLimite = (currentMinutes > finPointageMins) && (currentMinutes < debutPointageMins);
      }

      if (aDepasseLimite) {
        let presence = await Attendance.findOne({
          employee: emp._id,
          date: { $gte: debutJour(now), $lte: finJour(now) },
        });

        if (!presence) {
          // 1. Marquer automatiquement l'employé comme ABSENT
          await Attendance.create({
            employee: emp._id,
            date: debutJour(now),
            statut: "Absent",
            retardMins: 0,
            retardPauseMins: 0,
            pointages: [],
          });

          // 2. Envoyer la notification d'absence à l'administrateur
          const dejaNotifie = await Notification.findOne({
            employee: emp._id,
            type: "absence",
            createdAt: { $gte: debutJour(now), $lte: finJour(now) },
          });

          if (!dejaNotifie) {
            const maxTxt = todayConfig.heureFinPointage || minutesToTime(finPointageMins);
            await Notification.create({
              employee: emp._id,
              type: "absence",
              message: `${emp.name} est marqué absent aujourd'hui (fin de pointage dépassée : ${maxTxt})`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Erreur checkAbsencesAutomatiques:", err.message);
  }
}

exports.checkAbsencesAutomatiques = checkAbsencesAutomatiques;

exports.getAll = async (req, res) => {
  try {
    const now = new Date();
    await checkAbsencesAutomatiques(now);
    await checkOubliFinDeService(now);

    const notifications = await Notification.find()
      .populate("employee", "name matricule photo")
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};