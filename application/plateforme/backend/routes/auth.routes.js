const router = require("express").Router();
const { register, login, logout, me,updateProfile, forgotPassword,resetPassword, toggleTwoFactor, verifyTwoFactorOTP  } = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });


router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", auth, me);

router.put("/profile", auth, upload.single("photo"), updateProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/2fa/verify", verifyTwoFactorOTP);
router.put("/2fa/toggle", auth, toggleTwoFactor);

module.exports = router;