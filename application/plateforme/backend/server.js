const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (ex: Postman, mobile native, ESP32)
    if (!origin) return callback(null, true);
    // Autoriser tout origin local ou sur le réseau LAN (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x)
    if (
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://192.168.") ||
      origin.startsWith("http://10.") ||
      origin.startsWith("http://172.")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/employees", require("./routes/employee.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));

app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/fingerprint", require("./routes/fingerprint.routes"));

app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/schedule", require("./routes/schedule.routes"));
app.use("/api/departments", require("./routes/department.routes"));
app.use("/api/system", require("./routes/system.routes"));

// Middleware centralisé de gestion des erreurs
const errorHandler = require("./middleware/error.middleware");
app.use(errorHandler);

const User = require("./models/User");
const sanitizeEmployees = require("./utils/sanitizeEmployees");
const startUdpDiscovery = require("./utils/udpDiscovery");
const seedDepartments = require("./utils/seedDepartments");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connecté");
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@biopulse.com").toLowerCase();
    await User.deleteMany({ email: adminEmail });
    console.log(`Compte admin nettoyé de MongoDB (authentification 100% .env : ${adminEmail})`);

    await seedDepartments();
    await sanitizeEmployees();
    startUdpDiscovery();
    app.listen(process.env.PORT || 5000, "0.0.0.0", () =>
      console.log(`Serveur lancé sur le port ${process.env.PORT || 5000} (0.0.0.0)`)
    );
  })
  .catch((err) => console.error(err));