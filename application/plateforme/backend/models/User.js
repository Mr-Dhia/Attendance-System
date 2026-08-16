const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "admin" },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOTP: { type: String },
  twoFactorOTPExpiry: { type: Date },
  photo: { type: String, default: null },
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);