const express = require("express");
const mongoose = require("mongoose");
const Sprint = require("../models/Sprint");
const Story = require("../models/Story");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all sprints
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching all sprints...");

    const sprints = await Sprint.find({});
    if (!sprints.length) {
      console.warn("⚠️ No sprints found!");
      return res.status(404).json({ message: "No sprints found in database" });
    }

    console.log(`✅ Found ${sprints.length} sprints`);
    res.json(sprints);
  } catch (error) {
    console.error("❌ Error fetching sprints:", error);
    res.status(500).json({ message: "Error fetching sprints", error: error.message });
  }
});



// GET sprint by ID
router.get("/:id", async (req, res) => {
  try {
    console.log(`📡 Fetching sprint ${req.params.id}...`);
    const sprint = await Sprint.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("project", "name key status")
      .populate({
        path: "stories",
        match: { isDeleted: { $ne: true } },
        select: "title key status storyPoints assignee",
      });

    if (!sprint) {
      console.warn("⚠️ Sprint not found.");
      return res.status(404).json({ message: "Sprint not found" });
    }

    console.log("✅ Sprint found:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error fetching sprint:", error);
    res.status(500).json({ message: "Error fetching sprint", error: error.message });
  }
});

module.exports = router;
