const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Story = require("../models/Story");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllProjects,
  createProject,
  getProjectById,
  deleteProject,
  updateProject,
  updateProjectStatus
} = require("../controllers/projectController");

const router = express.Router();

console.log("✅ Projects API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// SEED - Create test project (temporary route for testing)
router.post("/seed", async (req, res) => {
  try {
    console.log("📡 Seeding test project...");

    const testProject = new Project({
      name: "Test Project",
      key: "TEST-1",
      description: "A test project for development",
      owner: req.user.id,
      status: "ACTIVE",
      startDate: new Date(),
      methodology: "Agile",
      visibility: "Team Only",
      tags: ["test", "development"],
      metrics: {
        velocity: 0,
        completedStoryPoints: 0,
        totalStoryPoints: 0,
        avgCycleTime: 0
      }
    });

    await testProject.save();
    console.log("✅ Test project created:", testProject.name);
    res.status(201).json(testProject);
  } catch (error) {
    console.error("❌ Error seeding test project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET all projects
router.get("/", getAllProjects);

// GET project by ID
router.get("/:id", getProjectById);

// POST create new project
router.post("/", createProject);

// PUT update project
router.put("/:id", updateProject);

// PUT update project status
router.put("/:id/status", updateProjectStatus);

// DELETE project (soft delete)
router.delete("/:id", deleteProject);

// GET project metrics
router.get("/:id/metrics", async (req, res) => {
  try {
    console.log(`📡 Fetching metrics for project ${req.params.id}`);
    const project = await Project.findById(req.params.id)
      .populate("sprints")
      .populate("teams");

    if (!project) {
      console.log("⚠️ Project not found.");
      return res.status(404).json({ message: "Project not found" });
    }

    const metrics = {
      totalSprints: project.sprints.length,
      completedSprints: project.sprints.filter(
        (sprint) => sprint.status === "COMPLETED"
      ).length,
      teamSize: project.teams.reduce(
        (total, team) => total + (team.members?.length || 0),
        0
      ),
      velocity: project.metrics.velocity,
      completedStoryPoints: project.metrics.completedStoryPoints,
      totalStoryPoints: project.metrics.totalStoryPoints,
      avgCycleTime: project.metrics.avgCycleTime,
    };

    console.log("✅ Project metrics calculated:", metrics);
    res.json(metrics);
  } catch (error) {
    console.error("❌ Error fetching project metrics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
