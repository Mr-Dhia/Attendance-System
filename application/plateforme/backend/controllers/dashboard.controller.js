const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Total employés
    const totalEmployees = await Employee.countDocuments();

    // Présences aujourd'hui
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      statut: "À l'heure",
    });

    // Retards aujourd'hui
    const retardsToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      statut: "Retard",
    });

    // Absences aujourd'hui
    const absentsToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      statut: "Absent",
    });

    // Retards hier
    const retardsHier = await Attendance.countDocuments({
      date: { $gte: yesterday, $lt: today },
      statut: "Retard",
    });

    // Employés ajoutés ce mois
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newEmployees = await Employee.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      totalEmployees,
      presentToday,
      retardsToday,
      absentsToday,
      retardsHier,
      newEmployees,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeekData = async (req, res) => {
  try {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    const result = [];

    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const presents = await Attendance.countDocuments({ date: { $gte: date, $lt: nextDate }, statut: "À l'heure" });
      const retards = await Attendance.countDocuments({ date: { $gte: date, $lt: nextDate }, statut: "Retard" });
      const absents = await Attendance.countDocuments({ date: { $gte: date, $lt: nextDate }, statut: "Absent" });

      result.push({
        day: days[4 - i],
        Présents: presents,
        Retards: retards,
        Absents: absents,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecentLogs = async (req, res) => {
  try {
    const logs = await Attendance.find()
      .populate("employee", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(logs.map((log) => ({
      name: log.employee?.name || "Inconnu",
      time: log.heureArrivee || "—",
      status: log.statut,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};