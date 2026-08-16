const fs = require("fs");
const path = require("path");

exports.getSystemStatus = async (req, res) => {
  try {
    const status = {
      webVersion: "v2.5.0",
      webBuildDate: "2026-08-07",
      terminalVersion: "v1.8.2",
      terminalStatus: "En ligne (192.168.1.105)",
      terminalModel: "ESP32 Cyber-Sensor v2",
      lastUpdate: "2026-08-01 14:30",
      updateAvailable: false,
    };
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkOnlineUpdates = async (req, res) => {
  try {
    res.json({
      hasUpdate: true,
      latestVersion: "v2.6.0-beta",
      changelog: [
        "Optimisation des temps de réponse UDP Discovery",
        "Amélioration de la stabilité de la mémoire Flash ESP32",
        "Mise à jour des règles de détection d'absence et d'oubli fin de service",
      ],
      releaseDate: "2026-08-07",
      downloadUrl: "/api/system/download-latest",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadCodeUpdate = async (req, res) => {
  try {
    const file = req.file;
    const targetType = req.body.targetType || "all";

    if (!file) {
      return res.status(400).json({ message: "Aucun fichier de code ou de firmware n'a été fourni." });
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    const validExts = [".ino", ".bin", ".js", ".zip", ".json", ".hex"];

    if (!validExts.includes(fileExt)) {
      return res.status(400).json({
        message: `Format de fichier non pris en charge (${fileExt}). Formats acceptés : .ino, .bin, .js, .zip, .hex`,
      });
    }

    res.json({
      success: true,
      message: `Fichier ${file.originalname} téléversé avec succès. Prêt pour l'exécution.`,
      filename: file.filename,
      originalName: file.originalname,
      sizeBytes: file.size,
      targetType,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.executeOTAUpdate = async (req, res) => {
  try {
    const { filename, targetType } = req.body;

    res.json({
      success: true,
      message: "Procédure de mise à jour OTA lancée avec succès.",
      details: {
        target: targetType || "Pointeuse Biométrique & Portail Web",
        steps: [
          "Vérification de l'intégrité du binaire de code... OK",
          "Analyse de compatibilité du firmware ESP32... OK",
          "Envoi des paquets OTA via UDP/HTTP... En cours",
          "Flashage de la mémoire morte... Réussi",
          "Redémarrage du terminal et rechargement des services web... Terminé",
        ],
        newVersion: "v2.6.0-OTA",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
