const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth.middleware");
const systemController = require("../controllers/system.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/updates");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const fs = require("fs");
const upload = multer({ storage });

router.get("/status", auth, systemController.getSystemStatus);
router.get("/check-updates", auth, systemController.checkOnlineUpdates);
router.post("/upload", auth, upload.single("codeFile"), systemController.uploadCodeUpdate);
router.post("/execute-ota", auth, systemController.executeOTAUpdate);

module.exports = router;
