const express = require("express");
const mongoose = require("mongoose");
const Sprint = require("../models/Sprint");
const Story = require("../models/Story");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET all sprints
router.get("/test/sprints", async (req, res) => {
  try {
    console.log("📡 Fetching all sprints...");
    const sprints = await Sprint.find({ isDeleted: { $ne: true } })
      .populate('project', 'name key status')
      .populate({
        path: 'stories',
        match: { isDeleted: { $ne: true } },
        select: 'title key status storyPoints'
      })
      .sort({ startDate: -1 });
    console.log(`✅ Found ${sprints.length} sprints`);
    res.json(sprints);
  } catch (error) {
    console.error("❌ Error fetching sprints:", error);
    res.status(500).json({ message: "Error fetching sprints", error: error.message });
  }
});

// GET sprint by ID
router.get("/test/sprints/:id", async (req, res) => {
  try {
    console.log(`📡 Fetching sprint ${req.params.id}...`);
    const sprint = await Sprint.findOne({ 
      _id: req.params.id, 
      isDeleted: { $ne: true } 
    })
      .populate('project', 'name key status')
      .populate({
        path: 'stories',
        match: { isDeleted: { $ne: true } },
        select: 'title key status storyPoints assignee'
      });
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint found:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error fetching sprint:", error);
    res.status(500).json({ message: "Error fetching sprint", error: error.message });
  }
});

// POST create new sprint
router.post("/test/sprints", async (req, res) => {
  try {
    console.log("📡 Creating new sprint:", req.body);
    const sprint = new Sprint({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await sprint.save();
    console.log("✅ Sprint created:", sprint.name);
    res.status(201).json(sprint);
  } catch (error) {
    console.error("❌ Error creating sprint:", error);
    res.status(500).json({ message: "Error creating sprint", error: error.message });
  }
});

// PUT update sprint
router.put("/test/sprints/:id", async (req, res) => {
  try {
    console.log(`📡 Updating sprint ${req.params.id}:`, req.body);
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('project', 'name key status')
    .populate({
      path: 'stories',
      match: { isDeleted: { $ne: true } },
      select: 'title key status storyPoints assignee'
    });
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint updated:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error updating sprint:", error);
    res.status(500).json({ message: "Error updating sprint", error: error.message });
  }
});

// DELETE sprint (soft delete)
router.delete("/test/sprints/:id", async (req, res) => {
  try {
    console.log(`📡 Deleting sprint ${req.params.id}`);
    const sprint = await Sprint.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint deleted:", sprint.name);
    res.json({ message: "Sprint deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting sprint:", error);
    res.status(500).json({ message: "Error deleting sprint", error: error.message });
  }
});

// GET sprint stories
router.get("/test/sprints/:id/stories", async (req, res) => {
  try {
    console.log(`📡 Fetching stories for sprint ${req.params.id}`);
    const stories = await Story.find({ 
      sprint: req.params.id,
      isDeleted: { $ne: true }
    });
    console.log(`✅ Found ${stories.length} stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching sprint stories:", error);
    res.status(500).json({ message: "Error fetching sprint stories", error: error.message });
  }
});

// POST add story to sprint
router.post("/test/sprints/:id/stories/:storyId", async (req, res) => {
  try {
    console.log(`📡 Adding story ${req.params.storyId} to sprint ${req.params.id}`);
    const story = await Story.findByIdAndUpdate(
      req.params.storyId,
      { 
        sprint: req.params.id,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!story) {
      console.log("❌ Story not found");
      return res.status(404).json({ message: "Story not found" });
    }
    console.log("✅ Story added to sprint");
    res.json(story);
  } catch (error) {
    console.error("❌ Error adding story to sprint:", error);
    res.status(500).json({ message: "Error adding story to sprint", error: error.message });
  }
});

// DELETE remove story from sprint
router.delete("/test/sprints/:id/stories/:storyId", async (req, res) => {
  try {
    console.log(`📡 Removing story ${req.params.storyId} from sprint ${req.params.id}`);
    const story = await Story.findByIdAndUpdate(
      req.params.storyId,
      { 
        $unset: { sprint: "" },
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!story) {
      console.log("❌ Story not found");
      return res.status(404).json({ message: "Story not found" });
    }
    console.log("✅ Story removed from sprint");
    res.json(story);
  } catch (error) {
    console.error("❌ Error removing story from sprint:", error);
    res.status(500).json({ message: "Error removing story from sprint", error: error.message });
  }
});

// GET sprint metrics
router.get("/test/sprints/:id/metrics", async (req, res) => {
  try {
    console.log(`📡 Fetching metrics for sprint ${req.params.id}`);
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint metrics fetched");
    res.json(sprint.metrics);
  } catch (error) {
    console.error("❌ Error fetching sprint metrics:", error);
    res.status(500).json({ message: "Error fetching sprint metrics", error: error.message });
  }
});

// GET sprint burndown data
router.get("/test/sprints/:id/burndown", async (req, res) => {
  try {
    console.log(`📡 Fetching burndown data for sprint ${req.params.id}`);
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint burndown data fetched");
    res.json(sprint.metrics.burndownData);
  } catch (error) {
    console.error("❌ Error fetching sprint burndown data:", error);
    res.status(500).json({ message: "Error fetching sprint burndown data", error: error.message });
  }
});

// Start sprint
router.post("/test/sprints/:id/start", async (req, res) => {
  try {
    console.log(`📡 Starting sprint ${req.params.id}`);
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      {
        status: "Active",
        startDate: req.body.startDate || new Date(),
        endDate: req.body.endDate,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('project', 'name key status')
    .populate({
      path: 'stories',
      match: { isDeleted: { $ne: true } },
      select: 'title key status storyPoints assignee'
    });
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint started:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error starting sprint:", error);
    res.status(500).json({ message: "Error starting sprint", error: error.message });
  }
});

// Complete sprint
router.post("/test/sprints/:id/complete", async (req, res) => {
  try {
    console.log(`📡 Completing sprint ${req.params.id}`);
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      {
        status: "Completed",
        completedDate: new Date(),
        updatedAt: new Date(),
        "retrospective.summary": req.body.summary,
        "retrospective.wentWell": req.body.wentWell,
        "retrospective.needsImprovement": req.body.needsImprovement,
        "retrospective.actionItems": req.body.actionItems
      },
      { new: true }
    )
    .populate('project', 'name key status')
    .populate({
      path: 'stories',
      match: { isDeleted: { $ne: true } },
      select: 'title key status storyPoints assignee'
    });
    if (!sprint) {
      console.log("❌ Sprint not found");
      return res.status(404).json({ message: "Sprint not found" });
    }
    console.log("✅ Sprint completed:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error completing sprint:", error);
    res.status(500).json({ message: "Error completing sprint", error: error.message });
  }
});

module.exports = router; 