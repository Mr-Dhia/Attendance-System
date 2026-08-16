const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addPosition,
  updatePosition,
  deletePosition
} = require("../controllers/departmentController");

router.get("/", auth, getDepartments);
router.post("/", auth, createDepartment);
router.put("/:id", auth, updateDepartment);
router.delete("/:id", auth, deleteDepartment);

router.post("/:id/positions", auth, addPosition);
router.put("/:id/positions/:positionId", auth, updatePosition);
router.delete("/:id/positions/:positionId", auth, deletePosition);

module.exports = router;
