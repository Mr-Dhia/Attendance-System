const bcrypt = require("bcryptjs");
const pinAttempts = require("../utils/pinAttempts");

exports.verifyPin = async (req, res) => {
  const { pin, deviceId } = req.body;
  const id = deviceId || "default";

  if (pinAttempts.estBloque(id)) {
    return res.status(429).json({ valid: false, message: "Trop de tentatives, reessayez plus tard" });
  }

  if (!pin) {
    return res.status(400).json({ valid: false, message: "PIN requis" });
  }

  const envPin = process.env.ADMIN_PIN ; 

  if ((pin === envPin) ) {
    pinAttempts.reinitialiser(id);
    return res.json({ valid: true });
  } else {
    pinAttempts.enregistrerEchec(id);
    return res.json({ valid: false, message: "Code incorrect" });
  }
};