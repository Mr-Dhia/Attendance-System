const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getAll, markAsRead, markAllAsRead, deleteNotification } = require("../controllers/notification.controller");

router.get("/", auth, getAll);
router.put("/:id/read", auth, markAsRead);
router.put("/read-all", auth, markAllAsRead);
router.delete("/:id", auth, deleteNotification);

module.exports = router;