const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Story = require("../models/Story");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");

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
router.get("/", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.post("/", async (req, res) => {
  try {
    console.log("📡 Creating new project - Request Body:", JSON.stringify(req.body, null, 2));
    
    // Check required fields
    if (!req.body.name || !req.body.key) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "key"],
        received: Object.keys(req.body),
      });
    }

    // Create project object with all required fields
    const project = new Project({
      name: req.body.name,
      key: req.body.key,
      description: req.body.description || "",
      owner: req.user.id,
      status: req.body.status || "Active",
      // Handle dates explicitly
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      targetEndDate: req.body.targetEndDate ? new Date(req.body.targetEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      methodology: req.body.methodology || "Agile",
      visibility: req.body.visibility || "Team Only",
      tags: req.body.tags || [],
      metrics: {
        velocity: 0,
        completedStoryPoints: 0,
        totalStoryPoints: 0,
        avgCycleTime: 0
      }
    });

    console.log("📡 Saving project:", JSON.stringify(project, null, 2));
    const savedProject = await project.save();
    console.log("✅ Project created successfully");
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("❌ Error creating project:", error);
    if (error.name === 'ValidationError') {
      console.error("❌ Validation errors:", error.errors);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
