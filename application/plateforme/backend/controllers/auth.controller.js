const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const { totp } = require("otplib");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: "Compte créé avec succès" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@biopulse.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

    // 1. Vérification du compte Administrateur (défini dans .env - non stocké en base de données)
    if (email && email.trim().toLowerCase() === adminEmail) {
      const validAdmin = (password === adminPassword);
      if (!validAdmin) {
        return res.status(401).json({ message: "Mot de passe administrateur incorrect" });
      }

      const token = jwt.sign(
        { id: "admin_env", role: "admin", email: adminEmail },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        user: {
          id: "admin_env",
          name: process.env.ADMIN_NAME || "Dhia",
          email: adminEmail,
          role: "admin",
          photo: null,
        }
      });
    }

    // 2. Recherche en base de données pour les autres utilisateurs
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });

    // Si A2F activée → envoyer OTP et ne pas connecter encore
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorOTP = otp;
      user.twoFactorOTPExpiry = Date.now() + 600000;
      await user.save();

      await sendEmail({
        to: email,
        subject: "Code de vérification Smart Attendance",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
            <h2 style="color: #0f172a;">Smart Attendance</h2>
            <p>Votre code de vérification est :</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb; margin: 20px 0; text-align: center;">
              ${otp}
            </div>
            <p style="color: #666;">Ce code expire dans 10 minutes.</p>
          </div>
        `,
      });

      return res.json({ twoFactor: true, email });
    }

    // Sinon connexion normale
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, photo: user.photo || null }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleTwoFactor = async (req, res) => {
  try {
    if (req.user.id === "admin_env") {
      return res.json({ twoFactorEnabled: false });
    }
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    res.json({ twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendTwoFactorOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOTP = otp;
    user.twoFactorOTPExpiry = Date.now() + 600000; // 10 minutes
    await user.save();

    await sendEmail({
      to: email,
      subject: "Code de vérification Smart Attendance",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
          <h2 style="color: #0f172a;">Smart Attendance</h2>
          <p>Votre code de vérification est :</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb; margin: 20px 0; text-align: center;">
            ${otp}
          </div>
          <p style="color: #666;">Ce code expire dans 10 minutes.</p>
          <p style="color: #666;">Si vous n'avez pas tenté de vous connecter, ignorez cet email.</p>
        </div>
      `,
    });

    res.json({ message: "Code OTP envoyé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Vérifier l'OTP
exports.verifyTwoFactorOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      twoFactorOTP: otp,
      twoFactorOTPExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Code invalide ou expiré" });

    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, photo: user.photo || null }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Déconnecté avec succès" });
};

exports.me = async (req, res) => {
  try {
    if (req.user.id === "admin_env") {
      return res.json({
        _id: "admin_env",
        name: process.env.ADMIN_NAME || "Dhia",
        email: process.env.ADMIN_EMAIL || "admin@biopulse.com",
        role: "admin",
        photo: null,
      });
    }

    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.id === "admin_env") {
      return res.json({
        message: "Profil administrateur géré depuis .env",
        user: {
          id: "admin_env",
          name: process.env.ADMIN_NAME || "Dhia",
          email: process.env.ADMIN_EMAIL || "admin@biopulse.com",
          role: "admin",
          photo: null,
        }
      });
    }

    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Mot de passe actuel incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (req.file) user.photo = `/uploads/${req.file.filename}`;

    await user.save();
    res.json({ message: "Profil mis à jour", user: { id: user._id, name: user.name, email: user.email, role: user.role, photo: user.photo } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email introuvable" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
          <h2 style="color: #0f172a;">Smart Attendance</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Réinitialiser le mot de passe
          </a>
          <p style="color: #666;">Ce lien expire dans 1 heure.</p>
          <p style="color: #666;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    res.json({ message: "Email envoyé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Token invalide ou expiré" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};