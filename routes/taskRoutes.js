const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");
const taskController = require('../controllers/taskController');

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

module.exports = router; 