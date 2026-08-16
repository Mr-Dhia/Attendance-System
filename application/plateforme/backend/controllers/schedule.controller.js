const WorkSchedule = require("../models/WorkSchedule");
const Employee = require("../models/Employee");

const DEFAULT_DAYS = [
  { jourIndex: 1, nomJour: "Lundi", heureDebut: "08:00", heureFin: "17:00", heureDebutPointage: "07:30", heureFinPointage: "18:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 2, nomJour: "Mardi", heureDebut: "08:00", heureFin: "17:00", heureDebutPointage: "07:30", heureFinPointage: "18:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 3, nomJour: "Mercredi", heureDebut: "08:00", heureFin: "17:00", heureDebutPointage: "07:30", heureFinPointage: "18:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 4, nomJour: "Jeudi", heureDebut: "08:00", heureFin: "17:00", heureDebutPointage: "07:30", heureFinPointage: "18:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 5, nomJour: "Vendredi", heureDebut: "08:00", heureFin: "17:00", heureDebutPointage: "07:30", heureFinPointage: "18:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 6, nomJour: "Samedi", heureDebut: "08:00", heureFin: "12:00", heureDebutPointage: "07:30", heureFinPointage: "13:00", heureDebutPause: "12:00", heureFinPause: "13:00", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: false },
];

const DEFAULT_MATIN = [
  { jourIndex: 1, nomJour: "Lundi", heureDebut: "06:00", heureFin: "14:00", heureDebutPointage: "05:30", heureFinPointage: "15:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 2, nomJour: "Mardi", heureDebut: "06:00", heureFin: "14:00", heureDebutPointage: "05:30", heureFinPointage: "15:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 3, nomJour: "Mercredi", heureDebut: "06:00", heureFin: "14:00", heureDebutPointage: "05:30", heureFinPointage: "15:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 4, nomJour: "Jeudi", heureDebut: "06:00", heureFin: "14:00", heureDebutPointage: "05:30", heureFinPointage: "15:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 5, nomJour: "Vendredi", heureDebut: "06:00", heureFin: "14:00", heureDebutPointage: "05:30", heureFinPointage: "15:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 6, nomJour: "Samedi", heureDebut: "06:00", heureFin: "12:00", heureDebutPointage: "05:30", heureFinPointage: "13:00", heureDebutPause: "10:00", heureFinPause: "10:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: false },
];

const DEFAULT_SOIR = [
  { jourIndex: 1, nomJour: "Lundi", heureDebut: "14:00", heureFin: "22:00", heureDebutPointage: "13:30", heureFinPointage: "23:00", heureDebutPause: "18:00", heureFinPause: "18:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 2, nomJour: "Mardi", heureDebut: "14:00", heureFin: "22:00", heureDebutPointage: "13:30", heureFinPointage: "23:00", heureDebutPause: "18:00", heureFinPause: "18:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 3, nomJour: "Mercredi", heureDebut: "14:00", heureFin: "22:00", heureDebutPointage: "13:30", heureFinPointage: "23:00", heureDebutPause: "18:00", heureFinPause: "18:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 4, nomJour: "Jeudi", heureDebut: "14:00", heureFin: "22:00", heureDebutPointage: "13:30", heureFinPointage: "23:00", heureDebutPause: "18:00", heureFinPause: "18:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 5, nomJour: "Vendredi", heureDebut: "14:00", heureFin: "22:00", heureDebutPointage: "13:30", heureFinPointage: "23:00", heureDebutPause: "18:00", heureFinPause: "18:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: true },
  { jourIndex: 6, nomJour: "Samedi", heureDebut: "14:00", heureFin: "18:00", heureDebutPointage: "13:30", heureFinPointage: "19:00", heureDebutPause: "16:00", heureFinPause: "16:30", tolerenceRetardPause: 5, dureePauseCigaretteMax: 10, estJourOuvre: false },
];

async function ensureDefaultSchedules() {
  const count = await WorkSchedule.countDocuments();
  if (count === 0) {
    await WorkSchedule.create([
      { nom: "Horaire Standard", description: "Service normal (08h00 - 17h00)", estParDefaut: true, jours: DEFAULT_DAYS },
      { nom: "Équipe Matin", description: "Service du matin (06h00 - 14h00)", estParDefaut: false, jours: DEFAULT_MATIN },
      { nom: "Équipe Soir", description: "Service du soir (14h00 - 22h00)", estParDefaut: false, jours: DEFAULT_SOIR },
    ]);
  } else {
    await WorkSchedule.updateMany({}, { $pull: { jours: { $or: [{ jourIndex: 0 }, { nomJour: "Dimanche" }] } } });
  }
}

exports.getAllSchedules = async (req, res) => {
  try {
    await ensureDefaultSchedules();
    const schedules = await WorkSchedule.find().sort({ estParDefaut: -1, createdAt: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { nom, description, jours } = req.body;
    if (!nom) return res.status(400).json({ message: "Le nom de l'horaire est requis" });

    const schedule = await WorkSchedule.create({
      nom,
      description: description || "",
      jours: jours || DEFAULT_DAYS,
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { nom, description, jours } = req.body;
    const schedule = await WorkSchedule.findByIdAndUpdate(
      req.params.id,
      { nom, description, jours },
      { new: true }
    );
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await WorkSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Horaire introuvable" });
    if (schedule.estParDefaut) return res.status(400).json({ message: "Impossible de supprimer l'horaire par défaut" });

    await Employee.updateMany({ workSchedule: schedule._id }, { $set: { workSchedule: null } });
    await WorkSchedule.findByIdAndDelete(req.params.id);

    res.json({ message: "Horaire supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const WeeklyAssignment = require("../models/WeeklyAssignment");

function getWeekRange(dateStr) {
  let d;
  if (dateStr && typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-").map(Number);
    d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  } else {
    d = dateStr ? new Date(dateStr) : new Date();
  }

  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

exports.getWeeklyAssignments = async (req, res) => {
  try {
    const { weekDate } = req.query;
    const { monday, sunday } = getWeekRange(weekDate);

    // 1. Récupérer tous les régimes d'horaires
    await ensureDefaultSchedules();
    const schedules = await WorkSchedule.find().sort({ estParDefaut: -1, createdAt: 1 });

    // 2. Récupérer tous les employés actifs
    const employees = await Employee.find({ statut: { $ne: "Inactif" } });

    // 3. Initialiser la structure d'affectation pour chaque horaire
    const assignmentsMap = {};
    for (const sch of schedules) {
      assignmentsMap[sch._id.toString()] = {
        _id: null,
        weekStartDate: monday,
        weekEndDate: sunday,
        workSchedule: sch,
        employees: [],
      };
    }

    // 4. Charger les affectations explicites enregistrées précisément pour cette semaine
    const explicitAssignments = await WeeklyAssignment.find({
      weekStartDate: monday,
    }).populate("workSchedule");

    const explicitEmployeesMap = new Map();
    for (const exp of explicitAssignments) {
      if (exp.workSchedule && assignmentsMap[exp.workSchedule._id.toString()]) {
        assignmentsMap[exp.workSchedule._id.toString()]._id = exp._id;
        for (const empId of exp.employees) {
          explicitEmployeesMap.set(empId.toString(), exp.workSchedule._id.toString());
        }
      }
    }

    // 5. Pour chaque employé, déterminer l'horaire actif (Semaine exacte ou Héritage des semaines précédentes)
    for (const emp of employees) {
      const empIdStr = emp._id.toString();

      if (explicitEmployeesMap.has(empIdStr)) {
        const targetScheduleId = explicitEmployeesMap.get(empIdStr);
        if (assignmentsMap[targetScheduleId]) {
          assignmentsMap[targetScheduleId].employees.push(emp);
        }
        continue;
      }

      // Héritage automatique : chercher la TOUTE DERNIÈRE affectation hebdomadaire sur ou avant cette semaine
      const latestAss = await WeeklyAssignment.findOne({
        weekStartDate: { $lte: monday },
        employees: emp._id,
      }).sort({ weekStartDate: -1 });

      if (latestAss && latestAss.workSchedule && assignmentsMap[latestAss.workSchedule.toString()]) {
        assignmentsMap[latestAss.workSchedule.toString()].employees.push(emp);
      } else if (emp.workSchedule && assignmentsMap[emp.workSchedule.toString()]) {
        assignmentsMap[emp.workSchedule.toString()].employees.push(emp);
      } else {
        const defaultSch = schedules.find((s) => s.estParDefaut) || schedules[0];
        if (defaultSch && assignmentsMap[defaultSch._id.toString()]) {
          assignmentsMap[defaultSch._id.toString()].employees.push(emp);
        }
      }
    }

    const assignments = Object.values(assignmentsMap);

    res.json({
      weekStartDate: monday,
      weekEndDate: sunday,
      assignments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignWeeklyEmployees = async (req, res) => {
  try {
    const { scheduleId, employeeIds, weekDate } = req.body;
    const { monday, sunday } = getWeekRange(weekDate);

    const schedule = await WorkSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: "Horaire introuvable" });

    // Bloquer les employés inactifs / hors contrat
    const targetEmployees = await Employee.find({ _id: { $in: employeeIds } });
    const inactiveEmployees = targetEmployees.filter(e => e.statut === "Inactif");
    if (inactiveEmployees.length > 0) {
      return res.status(400).json({ message: `Impossible d'affecter un horaire : ${inactiveEmployees.length} employé(s) sont inactifs (hors contrat).` });
    }

    let assignment = await WeeklyAssignment.findOne({
      weekStartDate: monday,
      workSchedule: scheduleId,
    });

    if (assignment) {
      assignment.employees = employeeIds;
      await assignment.save();
    } else {
      assignment = await WeeklyAssignment.create({
        weekStartDate: monday,
        weekEndDate: sunday,
        workSchedule: scheduleId,
        employees: employeeIds,
      });
    }

    // Retirer ces employés des autres équipes de la MÊME semaine
    const otherAssignments = await WeeklyAssignment.find({
      weekStartDate: monday,
      workSchedule: { $ne: scheduleId },
    });

    for (const other of otherAssignments) {
      const updatedList = other.employees.filter((id) => !employeeIds.includes(id.toString()));
      if (updatedList.length !== other.employees.length) {
        other.employees = updatedList;
        await other.save();
      }
    }

    res.json({ message: `Affectation de la semaine mise à jour : ${employeeIds.length} employé(s) affecté(s) à l'horaire "${schedule.nom}".` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.assignEmployees = async (req, res) => {
  try {
    const { employeeIds } = req.body;
    const scheduleId = req.params.id;

    const schedule = await WorkSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: "Horaire introuvable" });

    // Impossible d'affecter un horaire à des employés inactifs (hors contrat)
    const targetEmployees = await Employee.find({ _id: { $in: employeeIds } });
    const inactiveEmployees = targetEmployees.filter(e => e.statut === "Inactif");
    if (inactiveEmployees.length > 0) {
      return res.status(400).json({ message: `Impossible d'affecter un horaire : ${inactiveEmployees.length} employé(s) sont inactifs (hors contrat).` });
    }

    // Mettre à jour l'horaire de travail sans modifier les dates de contrat de l'employé
    await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { $set: { workSchedule: schedule._id } }
    );

    // Désaffecter uniquement la référence d'horaire pour les employés retirés de cette équipe
    await Employee.updateMany(
      { workSchedule: schedule._id, _id: { $nin: employeeIds } },
      { $set: { workSchedule: null } }
    );

    res.json({ message: `${employeeIds.length} employé(s) affecté(s) à l'horaire "${schedule.nom}" avec succès !` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
