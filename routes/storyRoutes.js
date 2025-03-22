const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ Stories API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all stories
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching all stories...");
    const stories = await Story.find()
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${stories.length} stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET stories by project ID
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching stories for project ${projectId}...`);
    
    const stories = await Story.find({ project: projectId })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${stories.length} stories for project ${projectId}`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET a specific story by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching story ${id}...`);
    
    const story = await Story.findById(id)
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Found story: ${story.title}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error fetching story:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create a new story
router.post("/", async (req, res) => {
  try {
    console.log("📡 Creating new story:", req.body);
    
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

    // Generate story key (e.g., PROJECT-123)
    const count = await Story.countDocuments({ project: req.body.project });
    const key = `${project.key}-${count + 1}`;
    
    // Add reporter from authenticated user and key
    const storyData = {
      ...req.body,
      reporter: req.user.id,
      key: key
    };
    
    const story = new Story(storyData);
    await story.save();
    
    console.log(`✅ Story created: ${story.title}`);
    res.status(201).json(story);
  } catch (error) {
    console.error("❌ Error creating story:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update a story
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating story ${id}:`, req.body);
    
    const story = await Story.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story updated: ${story.title}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error updating story:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE a story
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Deleting story ${id}`);
    
    const story = await Story.findByIdAndDelete(id);

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story deleted: ${story.title}`);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting story:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 