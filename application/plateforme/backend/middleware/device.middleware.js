module.exports = (req, res, next) => {
  const key = req.headers["x-device-key"];

  if (!key || key !== process.env.DEVICE_KEY) {
    return res.status(401).json({ message: "Appareil non autorisé" });
  }

  next();
};
