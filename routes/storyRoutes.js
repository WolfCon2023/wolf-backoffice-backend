const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const verifyToken = require("../middleware/authMiddleware");
const storyController = require('../controllers/storyController');

const router = express.Router();

console.log("✅ Stories API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all stories
router.get("/", storyController.getAllStories);

// GET stories by project ID
router.get("/project/:projectId", storyController.getStoriesByProject);

// GET a specific story by ID
router.get("/:id", storyController.getStoryById);

// POST create a new story
router.post("/", storyController.createStory);

// PUT update a story
router.put("/:id", storyController.updateStory);

// PUT update story status
router.put("/:id/status", storyController.updateStoryStatus);

// DELETE a story
router.delete("/:id", storyController.deleteStory);

// RESTORE a story marked for deletion
router.put("/:id/restore", storyController.restoreStory);

// GET all deleted stories
router.get("/deleted", storyController.getDeletedStories);

module.exports = router; 