const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");
const taskController = require('../controllers/taskController');
const Task = require('../models/Task');

const router = express.Router();

console.log("✅ Tasks API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all tasks
router.get("/", taskController.getAllTasks);

// GET tasks by project ID
router.get("/project/:projectId", taskController.getTasksByProject);

// GET tasks by sprint ID
router.get("/sprint/:sprintId", taskController.getTasksBySprint);

// GET a specific task by ID
router.get("/:id", taskController.getTaskById);

// POST create a new task
router.post("/", taskController.createTask);

// PUT update a task
router.put("/:id", taskController.updateTask);

// DELETE a task
router.delete("/:id", taskController.deleteTask);

// Get all tasks
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('project', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Get task by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('sprint', 'name sprintNumber');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Create new task
router.post('/', verifyToken, async (req, res) => {
  try {
    const nextTaskNumber = await getNextTaskNumber(req.body.project);
    const task = new Task({
      ...req.body,
      taskNumber: nextTaskNumber,
      key: `TASK-${nextTaskNumber}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Get tasks by project
router.get('/project/:projectId', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('project', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    res.status(500).json({ message: 'Error fetching tasks by project' });
  }
});

// Get tasks by sprint
router.get('/sprint/:sprintId', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ sprint: req.params.sprintId })
      .populate('project', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by sprint:', error);
    res.status(500).json({ message: 'Error fetching tasks by sprint' });
  }
});

// Helper function to get next task number
async function getNextTaskNumber(projectId) {
  const highestTask = await Task.findOne({ project: projectId })
    .sort({ taskNumber: -1 })
    .select('taskNumber');
  return highestTask ? highestTask.taskNumber + 1 : 1;
}

module.exports = router; 