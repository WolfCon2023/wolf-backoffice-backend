const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const teamController = require("../controllers/teamController");

const router = express.Router();

console.log("✅ Teams API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all teams
router.get("/", teamController.getAllTeams);

// GET team by ID
router.get("/:id", teamController.getTeamById);

// POST create new team
router.post("/", teamController.createTeam);

// PUT update team
router.put("/:id", teamController.updateTeam);

// DELETE team (soft delete)
router.delete("/:id", teamController.deleteTeam);

// API for updating team status only
router.put("/:id/status", teamController.updateTeamStatus);

// GET team members
router.get("/:id/members", teamController.getTeamMembers);

module.exports = router;
