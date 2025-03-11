const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Story = require("../models/Story");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");  // ✅ Fixed authentication import

const router = express.Router();

console.log("✅ Projects API Route Loaded");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// SEED - Create test project (temporary route for testing)
router.post("/seed", authenticateToken, async (req, res) => {
  try {
    console.log("📡 Seeding test project...");

    // Create a test project
    const testProject = new Project({
      name: "Test Project",
      key: "TEST-1",
      description: "A test project for development",
      owner: req.user.id, // Authenticated user's ID
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
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("📡 Fetching all projects...");
    const projects = await Project.find({ isDeleted: { $ne: true } })
      .populate("owner", "name email")
      .populate("teams", "name");

    if (!projects.length) {
      console.log("⚠️ No projects found.");
      return res.status(404).json({ message: "No projects found" });
    }

    console.log(`✅ Found ${projects.length} projects`);
    res.json(projects);
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET project by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    console.log(`📡 Fetching project ${req.params.id}...`);
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email")
      .populate("teams", "name");

    if (!project) {
      console.log("⚠️ Project not found.");
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("✅ Project found:", project.name);
    res.json(project);
  } catch (error) {
    console.error("❌ Error fetching project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("📡 Creating new project - Request Body:", req.body);

    if (!req.body.name || !req.body.key) {
      console.log("❌ Validation Error: Missing required fields");
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "key"],
        received: Object.keys(req.body),
      });
    }

    const project = new Project({
      name: req.body.name,
      key: req.body.key,
      description: req.body.description || "",
      owner: req.user.id,
      status: req.body.status || "ACTIVE",
      startDate: req.body.startDate || new Date(),
      methodology: req.body.methodology || "Agile",
      visibility: req.body.visibility || "Team Only",
      tags: req.body.tags || [],
      metrics: {
        velocity: 0,
        completedStoryPoints: 0,
        totalStoryPoints: 0,
        avgCycleTime: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("📡 Attempting to save project:", project);
    const savedProject = await project.save();
    console.log("✅ Project created successfully:", savedProject);
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("❌ Error creating project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update project
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    console.log(`📡 Updating project ${req.params.id}:`, req.body);
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!project) {
      console.log("⚠️ Project not found.");
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("✅ Project updated:", project.name);
    res.json(project);
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE project (soft delete)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    console.log(`📡 Deleting project ${req.params.id}`);
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!project) {
      console.log("⚠️ Project not found.");
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("✅ Project deleted:", project.name);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET project metrics
router.get("/:id/metrics", authenticateToken, async (req, res) => {
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
