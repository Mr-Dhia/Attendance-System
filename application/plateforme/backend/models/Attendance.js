const mongoose = require("mongoose");

const pointageSchema = new mongoose.Schema({
  heure: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, default: "" },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },
  pointages: { type: [pointageSchema], default: [] },
  statut: { type: String, enum: ["À l'heure", "Retard", "Absent"], required: true },
  retardMins: { type: Number, default: 0 },       // Retard en minutes à l'entrée du matin / service
  retardPauseMins: { type: Number, default: 0 },  // Retard en minutes au retour de la pause repas
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);