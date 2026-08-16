const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cin: { type: String, unique: true, sparse: true },
  matricule: { type: String, required: true, unique: true },
  department: { type: String, default: "Non défini" },
  poste: { type: String, default: "Non défini" },
  email: { type: String, unique: true, sparse: true },
  telephone: { type: String, unique: true, sparse: true },
  dateEmbauche: { type: Date, default: Date.now },
  statut: { type: String, enum: ["Actif", "Inactif"], default: "Actif" },
  photo: { type: String, default: "" },
  fingerIDs: { type: [Number], default: [] },
  workSchedule: { type: mongoose.Schema.Types.ObjectId, ref: "WorkSchedule", default: null },
  scheduleStartDate: { type: Date, default: null },
  scheduleEndDate: { type: Date, default: null },
  creeRapide: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);