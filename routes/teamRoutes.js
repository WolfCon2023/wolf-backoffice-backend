const express = require("express");
const mongoose = require("mongoose");
const Team = require("../models/Team");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET all teams
router.get("/test/teams", async (req, res) => {
  try {
    console.log("📡 Fetching all teams...");
    const teams = await Team.find({ isDeleted: { $ne: true } })
      .populate('members.user', 'name email')
      .populate('projects', 'name key');
    console.log(`✅ Found ${teams.length} teams`);
    res.json(teams);
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
});

// GET team by ID
router.get("/test/teams/:id", async (req, res) => {
  try {
    console.log(`📡 Fetching team ${req.params.id}...`);
    const team = await Team.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('members.user', 'name email')
      .populate('projects', 'name key status');

    if (!team) {
      console.log("❌ Team not found");
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
router.post("/test/teams", async (req, res) => {
  try {
    console.log("📡 Creating new team:", req.body);
    const team = new Team({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
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
router.put("/test/teams/:id", async (req, res) => {
  try {
    console.log(`📡 Updating team ${req.params.id}:`, req.body);
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('members.user', 'name email')
    .populate('projects', 'name key status');

    if (!team) {
      console.log("❌ Team not found");
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
router.delete("/test/teams/:id", async (req, res) => {
  try {
    console.log(`📡 Deleting team ${req.params.id}`);
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team deleted:", team.name);
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
});

// GET team members
router.get("/test/teams/:id/members", async (req, res) => {
  try {
    console.log(`📡 Fetching members for team ${req.params.id}`);
    const team = await Team.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('members.user', 'name email');

    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log(`✅ Found ${team.members.length} members`);
    res.json(team.members);
  } catch (error) {
    console.error("❌ Error fetching team members:", error);
    res.status(500).json({ message: "Error fetching team members", error: error.message });
  }
});

// POST add team member
router.post("/test/teams/:id/members", async (req, res) => {
  try {
    console.log(`📡 Adding member to team ${req.params.id}:`, req.body);
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { 
        $push: { 
          members: {
            user: req.body.userId,
            role: req.body.role,
            joinedAt: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    ).populate('members.user', 'name email');

    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Member added to team");
    res.json(team.members);
  } catch (error) {
    console.error("❌ Error adding team member:", error);
    res.status(500).json({ message: "Error adding team member", error: error.message });
  }
});

// DELETE remove team member
router.delete("/test/teams/:id/members/:userId", async (req, res) => {
  try {
    console.log(`📡 Removing member ${req.params.userId} from team ${req.params.id}`);
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      {
        $pull: { members: { user: req.params.userId } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Member removed from team");
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("❌ Error removing team member:", error);
    res.status(500).json({ message: "Error removing team member", error: error.message });
  }
});

// GET team metrics
router.get("/test/teams/:id/metrics", async (req, res) => {
  try {
    console.log(`📡 Fetching metrics for team ${req.params.id}`);
    const team = await Team.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team metrics fetched");
    res.json(team.metrics);
  } catch (error) {
    console.error("❌ Error fetching team metrics:", error);
    res.status(500).json({ message: "Error fetching team metrics", error: error.message });
  }
});

// GET team velocity
router.get("/test/teams/:id/velocity", async (req, res) => {
  try {
    console.log(`📡 Fetching velocity for team ${req.params.id}`);
    const team = await Team.findById(req.params.id);
    if (!team) {
      console.log("❌ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }
    console.log("✅ Team velocity fetched");
    res.json({
      averageVelocity: team.metrics.averageVelocity,
      sprintCompletionRate: team.metrics.sprintCompletionRate
    });
  } catch (error) {
    console.error("❌ Error fetching team velocity:", error);
    res.status(500).json({ message: "Error fetching team velocity", error: error.message });
  }
});

module.exports = router; 