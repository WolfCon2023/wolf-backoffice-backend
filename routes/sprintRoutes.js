const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllSprints,
  createSprint,
  getSprintById,
  deleteSprint,
  updateSprint,
  updateSprintStatus
} = require("../controllers/sprintController");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all sprints
router.get("/", getAllSprints);

// POST create new sprint
router.post("/", createSprint);

// GET sprint by ID
router.get("/:id", getSprintById);

// PUT update sprint
router.put("/:id", updateSprint);

// PUT update sprint status
router.put("/:id/status", updateSprintStatus);

// DELETE sprint (soft delete)
router.delete("/:id", deleteSprint);

module.exports = router;
