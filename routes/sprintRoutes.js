const express = require("express");
const mongoose = require("mongoose");
const Sprint = require("../models/Sprint");
const Story = require("../models/Story");
const verifyToken = require("../middleware/authMiddleware"); // ✅ Fixed authentication import

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all sprints
router.get("/test/sprints", verifyToken, async (req, res) => {
  try {
    console.log("📡 Fetching all sprints...");
    const sprints = await Sprint.find({ isDeleted: { $ne: true } })
      .populate("project", "name key status")
      .populate({
        path: "stories",
        match: { isDeleted: { $ne: true } },
        select: "title key status storyPoints",
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
router.get("/test/sprints/:id", verifyToken, async (req, res) => {
  try {
    console.log(`📡 Fetching sprint ${req.params.id}...`);
    const sprint = await Sprint.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .populate("project", "name key status")
      .populate({
        path: "stories",
        match: { isDeleted: { $ne: true } },
        select: "title key status storyPoints assignee",
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
router.post("/test/sprints", verifyToken, async (req, res) => {
  try {
    console.log("📡 Creating new sprint:", req.body);
    const sprint = new Sprint({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
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
router.put("/test/sprints/:id", verifyToken, async (req, res) => {
  try {
    console.log(`📡 Updating sprint ${req.params.id}:`, req.body);
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("project", "name key status")
      .populate({
        path: "stories",
        match: { isDeleted: { $ne: true } },
        select: "title key status storyPoints assignee",
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
router.delete("/test/sprints/:id", verifyToken, async (req, res) => {
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
router.get("/test/sprints/:id/stories", verifyToken, async (req, res) => {
  try {
    console.log(`📡 Fetching stories for sprint ${req.params.id}`);
    const stories = await Story.find({
      sprint: req.params.id,
      isDeleted: { $ne: true },
    });
    console.log(`✅ Found ${stories.length} stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching sprint stories:", error);
    res.status(500).json({ message: "Error fetching sprint stories", error: error.message });
  }
});

module.exports = router;
