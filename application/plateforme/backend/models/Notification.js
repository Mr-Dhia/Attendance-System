const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  type: { type: String, enum: ["retard", "absence", "presence", "empreinte", "oubli_fin_service"], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);