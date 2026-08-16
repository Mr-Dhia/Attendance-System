const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/weekly", scheduleController.getWeeklyAssignments);
router.post("/weekly/assign", scheduleController.assignWeeklyEmployees);
router.get("/", scheduleController.getAllSchedules);
router.post("/", scheduleController.createSchedule);
router.put("/:id", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);
router.post("/:id/assign", scheduleController.assignEmployees);

module.exports = router;
