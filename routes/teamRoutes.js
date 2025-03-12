const express = require("express");
const mongoose = require("mongoose");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all teams
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching all teams...");
    
    const teams = await Team.find({});
    if (!teams.length) {
      console.warn("⚠️ No teams found!");
      return res.status(404).json({ message: "No teams found in database" });
    }

    console.log(`✅ Found ${teams.length} teams`);
    res.json(teams);
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
});


// GET team by ID
router.get("/:id", async (req, res) => {
  try {
    console.log(`📡 Fetching team ${req.params.id}...`);
    const team = await Team.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("members.user", "name email")
      .populate("projects", "name key status");

    if (!team) {
      console.warn("⚠️ Team not found.");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team found:", team.name);
    res.json(team);
  } catch (error) {
    console.error("❌ Error fetching team:", error);
    res.status(500).json({ message: "Error fetching team", error: error.message });
  }
});

// POST create new team
router.post("/", async (req, res) => {
  try {
    console.log("📡 Creating new team:", req.body);

    if (!req.body.name) {
      console.warn("⚠️ Validation Error: Missing required field 'name'");
      return res.status(400).json({ message: "Team name is required" });
    }

    const team = new Team({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await team.save();
    console.log("✅ Team created:", team.name);
    res.status(201).json(team);
  } catch (error) {
    console.error("❌ Error creating team:", error);
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
});

// PUT update team
router.put("/:id", async (req, res) => {
  try {
    console.log(`📡 Updating team ${req.params.id}:`, req.body);

    if (!req.body.name) {
      console.warn("⚠️ Validation Error: Missing required field 'name'");
      return res.status(400).json({ message: "Team name is required" });
    }

    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("members.user", "name email").populate("projects", "name key status");

    if (!team) {
      console.warn("⚠️ Team not found.");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team updated:", team.name);
    res.json(team);
  } catch (error) {
    console.error("❌ Error updating team:", error);
    res.status(500).json({ message: "Error updating team", error: error.message });
  }
});

// DELETE team (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    console.log(`📡 Deleting team ${req.params.id}...`);

    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!team) {
      console.warn("⚠️ Team not found.");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team deleted:", team.name);
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
});

module.exports = router;
