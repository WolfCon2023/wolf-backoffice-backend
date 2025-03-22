const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ Defects API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all defects
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching all defects...");
    const defects = await Story.find({ type: 'Bug' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${defects.length} defects`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET defects by project ID
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching defects for project ${projectId}...`);
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const defects = await Story.find({ project: projectId, type: 'Bug' })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${defects.length} defects for project ${projectId}`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET defects by sprint ID
router.get("/sprint/:sprintId", async (req, res) => {
  try {
    const { sprintId } = req.params;
    console.log(`📡 Fetching defects for sprint ${sprintId}...`);
    
    // Check if sprint exists
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }
    
    const defects = await Story.find({ sprint: sprintId, type: 'Bug' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    console.log(`✅ Found ${defects.length} defects for sprint ${sprintId}`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects by sprint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET a specific defect by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching defect ${id}...`);
    
    const defect = await Story.findOne({ _id: id, type: 'Bug' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Found defect: ${defect.title}`);
    res.json(defect);
  } catch (error) {
    console.error("❌ Error fetching defect:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create a new defect
router.post("/", async (req, res) => {
  try {
    console.log("📡 Creating new defect:", req.body);
    
    // Check required fields
    if (!req.body.title || !req.body.project) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["title", "project"],
        received: Object.keys(req.body),
      });
    }
    
    // Validate project exists
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(400).json({
        message: "Invalid project ID",
        projectId: req.body.project
      });
    }

    // Generate defect key (e.g., PROJECT-BUG-123)
    const count = await Story.countDocuments({ 
      project: req.body.project,
      type: 'Bug'
    });
    const key = `${project.key}-BUG-${count + 1}`;
    
    // Add type, reporter, priority and key
    const defectData = {
      ...req.body,
      type: 'Bug',
      reporter: req.user.id,
      // Set priority to 'High' by default for bugs
      priority: req.body.priority || 'High',
      key: key
    };
    
    const defect = new Story(defectData);
    await defect.save();
    
    console.log(`✅ Defect created: ${defect.title}`);
    res.status(201).json(defect);
  } catch (error) {
    console.error("❌ Error creating defect:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update a defect
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating defect ${id}:`, req.body);
    
    // Ensure we can't change the type from 'Bug'
    const updateData = {
      ...req.body,
      type: 'Bug',
      updatedAt: Date.now()
    };
    
    const defect = await Story.findOneAndUpdate(
      { _id: id, type: 'Bug' },
      updateData,
      { new: true, runValidators: true }
    );

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Defect updated: ${defect.title}`);
    res.json(defect);
  } catch (error) {
    console.error("❌ Error updating defect:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE a defect
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Deleting defect ${id}`);
    
    const defect = await Story.findOneAndDelete({ _id: id, type: 'Bug' });

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Defect deleted: ${defect.title}`);
    res.json({ message: "Defect deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting defect:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 