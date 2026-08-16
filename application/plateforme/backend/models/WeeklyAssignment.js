const mongoose = require("mongoose");

const weeklyAssignmentSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true }, // Lundi de la semaine (00:00:00)
  weekEndDate: { type: Date, required: true },   // Samedi de la semaine (23:59:59)
  workSchedule: { type: mongoose.Schema.Types.ObjectId, ref: "WorkSchedule", required: true },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
}, { timestamps: true });

weeklyAssignmentSchema.index({ weekStartDate: 1, workSchedule: 1 }, { unique: true });

module.exports = mongoose.model("WeeklyAssignment", weeklyAssignmentSchema);
