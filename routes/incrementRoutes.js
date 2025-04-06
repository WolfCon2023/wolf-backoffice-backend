const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Increment = require('../models/Increment');
const Sprint = require('../models/Sprint');
const verifyToken = require('../middleware/authMiddleware');

// Get all increments (with optional filtering)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      project, 
      sprint, 
      incrementType, 
      status, 
      assignedTo, 
      priority 
    } = req.query;
    
    const filter = { isDeleted: false };
    
    if (project) filter.project = project;
    if (sprint) filter.sprint = sprint;
    if (incrementType) filter.incrementType = incrementType;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    
    const increments = await Increment.find(filter)
      .populate('project', 'name key')
      .populate('sprint', 'name status')
      .populate('assignedTo', 'firstName lastName username')
      .populate('createdBy', 'firstName lastName username')
      .sort({ updatedAt: -1 });
    
    res.status(200).json(increments);
  } catch (error) {
    console.error("Error fetching increments:", error);
    res.status(500).json({ message: "Error fetching increments", error: error.message });
  }
});

// Get increments for backlog view (grouped by sprint)
router.get('/backlog', verifyToken, async (req, res) => {
  try {
    const { project } = req.query;
    
    if (!project) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    
    // Get active and future sprints
    const sprints = await Sprint.find({ 
      project,
      status: { $in: ['PLANNING', 'IN_PROGRESS'] },
      isDeleted: false
    }).sort({ startDate: 1 });
    
    // Get all increments for this project
    const increments = await Increment.find({ 
      project,
      isDeleted: false
    })
    .populate('project', 'name key')
    .populate('sprint', 'name status startDate endDate')
    .populate('assignedTo', 'firstName lastName username email')
    .populate('createdBy', 'firstName lastName username');
    
    // Group increments by sprint (or backlog if no sprint assigned)
    const backlogData = {
      sprints: sprints.map(sprint => ({
        _id: sprint._id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        increments: increments.filter(inc => inc.sprint && inc.sprint._id.toString() === sprint._id.toString())
      })),
      backlogItems: increments.filter(inc => !inc.sprint)
    };
    
    res.status(200).json(backlogData);
  } catch (error) {
    console.error("Error fetching backlog data:", error);
    res.status(500).json({ message: "Error fetching backlog data", error: error.message });
  }
});

// Get a single increment by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const increment = await Increment.findById(req.params.id)
      .populate('project', 'name key')
      .populate('sprint', 'name status startDate endDate')
      .populate('epic', 'name')
      .populate('assignedTo', 'firstName lastName username')
      .populate('createdBy', 'firstName lastName username')
      .populate('dependencies', 'title key status')
      .populate({
        path: 'comments.author',
        select: 'firstName lastName username'
      });
    
    if (!increment) {
      return res.status(404).json({ message: "Increment not found" });
    }
    
    res.status(200).json(increment);
  } catch (error) {
    console.error("Error fetching increment:", error);
    res.status(500).json({ message: "Error fetching increment", error: error.message });
  }
});

// Create a new increment
router.post('/', verifyToken, async (req, res) => {
  try {
    // Generate a unique key if not provided
    if (!req.body.key) {
      const prefix = req.body.incrementType.substring(0, 1).toUpperCase(); // s for story, t for task, d for defect
      const count = await Increment.countDocuments({ incrementType: req.body.incrementType });
      req.body.key = `${prefix}-${count + 1}`;
    }
    
    // Set the createdBy to the current user if not provided
    if (!req.body.createdBy) {
      req.body.createdBy = req.user.id;
    }
    
    const increment = new Increment(req.body);
    const savedIncrement = await increment.save();
    
    res.status(201).json(savedIncrement);
  } catch (error) {
    console.error("Error creating increment:", error);
    res.status(500).json({ message: "Error creating increment", error: error.message });
  }
});

// Update an increment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const incrementId = req.params.id;
    
    // Prevent updating key field
    if (req.body.key) {
      delete req.body.key;
    }
    
    const updatedIncrement = await Increment.findByIdAndUpdate(
      incrementId,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName username')
     .populate('createdBy', 'firstName lastName username');
    
    if (!updatedIncrement) {
      return res.status(404).json({ message: "Increment not found" });
    }
    
    res.status(200).json(updatedIncrement);
  } catch (error) {
    console.error("Error updating increment:", error);
    res.status(500).json({ message: "Error updating increment", error: error.message });
  }
});

// Delete an increment (soft delete)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const increment = await Increment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!increment) {
      return res.status(404).json({ message: "Increment not found" });
    }
    
    res.status(200).json({ message: "Increment deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting increment:", error);
    res.status(500).json({ message: "Error deleting increment", error: error.message });
  }
});

// Add/remove increment to/from sprint
router.put('/:id/sprint/:sprintId', verifyToken, async (req, res) => {
  try {
    const { id, sprintId } = req.params;
    const { action } = req.body; // 'add' or 'remove'
    
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'add' or 'remove'" });
    }
    
    // If removing from sprint, set sprint to null
    const update = action === 'add' 
      ? { sprint: sprintId }
      : { sprint: null };
    
    const increment = await Increment.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).populate('sprint', 'name');
    
    if (!increment) {
      return res.status(404).json({ message: "Increment not found" });
    }
    
    const message = action === 'add' 
      ? `Increment added to sprint ${increment.sprint.name}` 
      : 'Increment removed from sprint';
    
    res.status(200).json({ message, increment });
  } catch (error) {
    console.error("Error updating increment sprint:", error);
    res.status(500).json({ message: "Error updating increment sprint", error: error.message });
  }
});

// Add a comment to an increment
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    
    const comment = {
      text,
      author: req.user.id,
      createdAt: new Date()
    };
    
    const increment = await Increment.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    ).populate({
      path: 'comments.author',
      select: 'firstName lastName username'
    });
    
    if (!increment) {
      return res.status(404).json({ message: "Increment not found" });
    }
    
    res.status(201).json(increment.comments[increment.comments.length - 1]);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
});

module.exports = router; 