const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { checkAbsencesAutomatiques } = require("./notification.controller");

exports.getAll = async (req, res) => {
  try {
    await checkAbsencesAutomatiques();
    const { date, statut, employee } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    if (statut) filter.statut = statut;
    if (employee) filter.employee = employee;

    const logs = await Attendance.find(filter)
      .populate("employee", "name matricule photo")
      .sort({ date: -1, createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { employee, date, heureArrivee, statut } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ message: "Employé introuvable" });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (emp.statut === "Inactif") {
      return res.status(400).json({ message: "Impossible d'enregistrer le pointage : L'employé est inactif." });
    }

    if (emp.scheduleStartDate) {
      const sStart = new Date(emp.scheduleStartDate);
      sStart.setHours(0, 0, 0, 0);
      if (targetDate < sStart) {
        return res.status(400).json({ message: "Impossible d'enregistrer le pointage : L'employé est hors contrat à cette date." });
      }
    }

    if (emp.scheduleEndDate) {
      const sEnd = new Date(emp.scheduleEndDate);
      sEnd.setHours(23, 59, 59, 999);
      if (targetDate > sEnd) {
        return res.status(400).json({ message: "Impossible d'enregistrer le pointage : L'employé est hors contrat à cette date (contrat expiré)." });
      }
    }

    const log = await Attendance.create({ employee, date, heureArrivee, statut });
    const populated = await log.populate("employee", "name matricule photo");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    let log = await Attendance.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Pointage introuvable" });

    if (req.body.pointages !== undefined) log.pointages = req.body.pointages;
    if (req.body.date !== undefined) log.date = req.body.date;
    if (req.body.employee !== undefined) log.employee = req.body.employee;

    log = await recalculerStatutEtRetards(log);
    await log.save();

    const populated = await Attendance.findById(log._id).populate("employee", "name matricule photo");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

function timeToMinutes(tStr) {
  if (!tStr || typeof tStr !== "string" || !tStr.includes(":")) return 0;
  const [h, m] = tStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

async function recalculerStatutEtRetards(log) {
  if (!log || !log.employee) return log;

  if (!log.pointages || log.pointages.length === 0) {
    log.statut = "À l'heure";
    log.retardMins = 0;
    log.retardPauseMins = 0;
    return log;
  }

  const WorkSchedule = require("../models/WorkSchedule");
  const WeeklyAssignment = require("../models/WeeklyAssignment");

  const dateObj = new Date(log.date);
  const dayIndex = dateObj.getDay();

  const emp = await Employee.findById(log.employee);
  let userSchedule = null;

  if (emp) {
    const weeklyAss = await WeeklyAssignment.findOne({
      weekStartDate: { $lte: dateObj },
      employees: emp._id,
    }).sort({ weekStartDate: -1 }).populate("workSchedule");
    if (weeklyAss && weeklyAss.workSchedule) {
      userSchedule = weeklyAss.workSchedule;
    } else if (emp.workSchedule) {
      userSchedule = await WorkSchedule.findById(emp.workSchedule);
    }
  }

  if (!userSchedule) {
    userSchedule = (await WorkSchedule.findOne({ estParDefaut: true })) || (await WorkSchedule.findOne());
  }

  const todayConfig = userSchedule?.jours?.find((j) => j.jourIndex === dayIndex) || {};

  const heureDebutMins = timeToMinutes(todayConfig.heureDebut || "08:00");
  const debutPauseMins = timeToMinutes(todayConfig.heureDebutPause || "12:00");
  const finPauseMins = timeToMinutes(todayConfig.heureFinPause || "13:00");

  const tolerenceEntree = todayConfig.tolerenceRetardEntree !== undefined ? Number(todayConfig.tolerenceRetardEntree) : 5;
  const tolerencePause = todayConfig.tolerenceRetardPause !== undefined ? Number(todayConfig.tolerenceRetardPause) : 5;
  const maxPauseCigaretteMins = todayConfig.dureePauseCigaretteMax !== undefined ? Number(todayConfig.dureePauseCigaretteMax) : 10;

  // 1. Recalcul du retard d'entrée de service
  const firstEntry = log.pointages.find((p) => p.type === "entree");
  let retardEntreeMins = 0;
  if (firstEntry) {
    const entryMins = timeToMinutes(firstEntry.heure);
    const diff = entryMins - heureDebutMins;
    if (diff > tolerenceEntree) {
      retardEntreeMins = diff;
    }
  }

  // 2. Recalcul des retards de pause
  let retardPauseTotalMins = 0;
  for (let i = 0; i < log.pointages.length; i++) {
    const p = log.pointages[i];
    if (p.type === "entree" && i > 0) {
      const prevSortie = log.pointages[i - 1];
      if (prevSortie && prevSortie.type === "sortie") {
        const entryMins = timeToMinutes(p.heure);
        const sortieMins = timeToMinutes(prevSortie.heure);

        const estRetourRepas = (prevSortie.label === "Sortie Repas") || (entryMins >= (debutPauseMins - 15) && entryMins <= (finPauseMins + 60));

        if (estRetourRepas) {
          const depassementPauseMins = entryMins - (finPauseMins + tolerencePause);
          if (depassementPauseMins > 0) {
            retardPauseTotalMins += Math.max(0, entryMins - finPauseMins);
          }
        } else {
          const dureePause = entryMins >= sortieMins ? (entryMins - sortieMins) : (entryMins + 1440 - sortieMins);
          if (dureePause > maxPauseCigaretteMins) {
            retardPauseTotalMins += Math.max(0, dureePause - maxPauseCigaretteMins);
          }
        }
      }
    }
  }

  log.retardMins = retardEntreeMins;
  log.retardPauseMins = retardPauseTotalMins;

  if (retardEntreeMins > 0) {
    log.statut = "Retard";
  } else {
    log.statut = "À l'heure";
  }

  return log;
};

exports.remove = async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: "Pointage supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};