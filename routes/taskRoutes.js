const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ Tasks API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all tasks
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching all tasks...");
    const tasks = await Story.find({ type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET tasks by project ID
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching tasks for project ${projectId}...`);
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const tasks = await Story.find({ project: projectId, type: 'Task' })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${tasks.length} tasks for project ${projectId}`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET tasks by sprint ID
router.get("/sprint/:sprintId", async (req, res) => {
  try {
    const { sprintId } = req.params;
    console.log(`📡 Fetching tasks for sprint ${sprintId}...`);
    
    // Check if sprint exists
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }
    
    const tasks = await Story.find({ sprint: sprintId, type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    console.log(`✅ Found ${tasks.length} tasks for sprint ${sprintId}`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks by sprint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET a specific task by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching task ${id}...`);
    
    const task = await Story.findOne({ _id: id, type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Found task: ${task.title}`);
    res.json(task);
  } catch (error) {
    console.error("❌ Error fetching task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create a new task
router.post("/", async (req, res) => {
  try {
    console.log("📡 Creating new task:", req.body);
    
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

    // Generate task key (e.g., PROJECT-TASK-123)
    const count = await Story.countDocuments({ 
      project: req.body.project,
      type: 'Task'
    });
    const key = `${project.key}-TASK-${count + 1}`;
    
    // Add type, reporter and key
    const taskData = {
      ...req.body,
      type: 'Task',
      reporter: req.user.id,
      key: key
    };
    
    const task = new Story(taskData);
    await task.save();
    
    console.log(`✅ Task created: ${task.title}`);
    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT update a task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating task ${id}:`, req.body);
    
    // Ensure we can't change the type from 'Task'
    const updateData = {
      ...req.body,
      type: 'Task',
      updatedAt: Date.now()
    };
    
    const task = await Story.findOneAndUpdate(
      { _id: id, type: 'Task' },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task updated: ${task.title}`);
    res.json(task);
  } catch (error) {
    console.error("❌ Error updating task:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Deleting task ${id}`);
    
    const task = await Story.findOneAndDelete({ _id: id, type: 'Task' });

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task deleted: ${task.title}`);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 