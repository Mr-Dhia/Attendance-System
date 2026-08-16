const router = require("express").Router();
const device = require("../middleware/device.middleware");

const { verifyPin } = require("../controllers/device.controller");

const { handleFingerprint, checkPending, getPendingDeletions, getUnassignedEmployees } = require("../controllers/fingerprint.controller");



router.post("/", device, handleFingerprint);
router.post("/verify-pin", device, verifyPin);
router.get("/pending", device, checkPending);
router.get("/pending-deletions", device, getPendingDeletions);
router.get("/unassigned", device, getUnassignedEmployees);
router.get("/time", (req, res) => {
  const now = new Date();
  res.json({ epoch: Math.floor(now.getTime() / 1000), iso: now.toISOString() });
});

module.exports = router;