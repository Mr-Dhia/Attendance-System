const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getStats, getWeekData, getRecentLogs } = require("../controllers/dashboard.controller");

router.get("/stats", auth, getStats);
router.get("/week", auth, getWeekData);
router.get("/logs", auth, getRecentLogs);

module.exports = router;