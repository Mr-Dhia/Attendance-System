const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const multer = require("multer");
const device = require("../middleware/device.middleware");
const { getAll, getOne, create, update, remove, requestFingerprintEnroll, removeFingerprint, quickCreate } = require("../controllers/employee.controller");


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get("/", auth, getAll);
router.post("/quick", device, quickCreate);
router.post("/quick-create", device, quickCreate);
router.get("/:id", auth, getOne);
router.post("/", auth, upload.single("photo"), create);
router.put("/:id", auth, upload.single("photo"), update);
router.delete("/:id", auth, remove);
router.delete("/:id/fingerprint/:fingerID", auth, removeFingerprint);
router.post("/:id/fingerprint/start", auth, requestFingerprintEnroll);

module.exports = router;