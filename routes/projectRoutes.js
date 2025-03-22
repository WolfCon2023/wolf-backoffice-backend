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
    
    // 1. Check if required fields are present
    if (!req.body.name || !req.body.key) {
      console.log("❌ Validation Error: Missing required fields");
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "key"],
        received: Object.keys(req.body),
      });
    }
    
    // 2. Prepare all required fields with defaults
    const projectData = {
      name: req.body.name,
      key: req.body.key,
      description: req.body.description || "",
      owner: req.user.id,
      status: req.body.status || "Active",
      methodology: req.body.methodology || "Agile",
      visibility: req.body.visibility || "Team Only",
      tags: req.body.tags || [],
    };
    
    // 3. Handle dates with explicit validation
    // Start date
    let startDate;
    try {
      startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
      if (isNaN(startDate.getTime())) {
        console.log("❌ Invalid startDate:", req.body.startDate);
        startDate = new Date();
      }
    } catch (e) {
      console.log("❌ Error parsing startDate:", e.message);
      startDate = new Date();
    }
    projectData.startDate = startDate;
    
    // Target end date
    let targetEndDate;
    try {
      targetEndDate = req.body.targetEndDate ? new Date(req.body.targetEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (isNaN(targetEndDate.getTime())) {
        console.log("❌ Invalid targetEndDate:", req.body.targetEndDate);
        targetEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } catch (e) {
      console.log("❌ Error parsing targetEndDate:", e.message);
      targetEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    projectData.targetEndDate = targetEndDate;
    
    // Add metrics and timestamps
    projectData.metrics = {
      velocity: 0,
      completedStoryPoints: 0,
      totalStoryPoints: 0,
      avgCycleTime: 0
    };
    projectData.createdAt = new Date();
    projectData.updatedAt = new Date();
    
    console.log("📡 Final project data to save:", JSON.stringify(projectData, null, 2));
    
    // 4. Create and save the project
    const project = new Project(projectData);
    const savedProject = await project.save();
    
    console.log("✅ Project created successfully:", savedProject);
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("❌ Error creating project:", error);
    console.error("❌ Error details:", error.message);
    if (error.name === 'ValidationError') {
      console.error("❌ Validation error details:", JSON.stringify(error.errors, null, 2));
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

// TEST ROUTE - Create project with hardcoded values
router.post("/test-create", async (req, res) => {
  try {
    console.log("📡 TEST ROUTE: Creating test project with hardcoded values");
    
    // Explicit date objects
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    console.log("📅 Dates to use:", {
      now: now.toISOString(),
      thirtyDaysLater: thirtyDaysLater.toISOString()
    });
    
    // Create a project with explicit values
    const testProject = {
      name: "Test Project " + now.toISOString().slice(0, 10),
      key: "TEST-" + Math.floor(Math.random() * 10000),
      description: "A test project created via the test endpoint",
      owner: req.user.id,
      status: "Active",
      startDate: now,
      targetEndDate: thirtyDaysLater,
      methodology: "Agile",
      visibility: "Team Only",
      tags: ["test"],
      metrics: {
        velocity: 0,
        completedStoryPoints: 0,
        totalStoryPoints: 0,
        avgCycleTime: 0
      }
    };
    
    console.log("📡 Test project data:", JSON.stringify(testProject, null, 2));
    console.log("📐 Test project data types:", {
      startDateType: typeof testProject.startDate,
      targetEndDateType: typeof testProject.targetEndDate,
      startDateIsDate: testProject.startDate instanceof Date,
      targetEndDateIsDate: testProject.targetEndDate instanceof Date,
    });
    
    // Create a new Project model instance directly with the raw object
    const project = new Project(testProject);
    
    // Inspect what Mongoose sees explicitly for dates
    console.log("📐 Mongoose model date fields:", {
      startDate: project.startDate,
      startDateType: typeof project.startDate,
      startDateIsDate: project.startDate instanceof Date,
      targetEndDate: project.targetEndDate,
      targetEndDateType: typeof project.targetEndDate,
      targetEndDateIsDate: project.targetEndDate instanceof Date,
    });
    
    // Save the project
    const savedProject = await project.save();
    
    console.log("✅ Test project created successfully:", savedProject);
    res.status(201).json({
      success: true,
      project: savedProject
    });
  } catch (error) {
    console.error("❌ Error creating test project:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    
    if (error.name === 'ValidationError') {
      console.error("❌ Validation error details:", JSON.stringify(error.errors, null, 2));
      
      // Check specific validation errors
      const validationErrors = Object.keys(error.errors).map(field => ({
        field,
        message: error.errors[field].message,
        value: error.errors[field].value,
        kind: error.errors[field].kind,
        path: error.errors[field].path
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false, 
      message: "Server error", 
      error: error.message
    });
  }
});

module.exports = router;
