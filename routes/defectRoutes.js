const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");
const defectController = require('../controllers/defectController');
const Defect = require('../models/Defect');

const router = express.Router();

console.log("✅ Defects API Route Loaded");

// GET all defects
router.get("/", verifyToken, async (req, res) => {
  try {
    const defects = await Defect.find()
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(defects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    res.status(500).json({ message: 'Error fetching defects' });
  }
});

// GET defects by project ID
router.get("/project/:projectId", verifyToken, async (req, res) => {
  try {
    const defects = await Defect.find({ projectId: req.params.projectId })
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(defects);
  } catch (error) {
    console.error('Error fetching defects by project:', error);
    res.status(500).json({ message: 'Error fetching defects by project' });
  }
});

// GET defects by sprint ID
router.get("/sprint/:sprintId", verifyToken, async (req, res) => {
  try {
    const defects = await Defect.find({ sprint: req.params.sprintId })
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    res.json(defects);
  } catch (error) {
    console.error('Error fetching defects by sprint:', error);
    res.status(500).json({ message: 'Error fetching defects by sprint' });
  }
});

// GET a specific defect by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const defect = await Defect.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    res.json(defect);
  } catch (error) {
    console.error('Error fetching defect:', error);
    res.status(500).json({ message: 'Error fetching defect' });
  }
});

// POST create a new defect
router.post("/", verifyToken, async (req, res) => {
  try {
    const nextDefectNumber = await getNextDefectNumber(req.body.projectId);
    const defect = new Defect({
      ...req.body,
      defectNumber: nextDefectNumber,
      key: `DEF-${nextDefectNumber}`,
      dateReported: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await defect.save();
    res.status(201).json(defect);
  } catch (error) {
    console.error('Error creating defect:', error);
    res.status(500).json({ message: 'Error creating defect' });
  }
});

// PUT update a defect
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const defect = await Defect.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    res.json(defect);
  } catch (error) {
    console.error('Error updating defect:', error);
    res.status(500).json({ message: 'Error updating defect' });
  }
});

// DELETE a defect
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const defect = await Defect.findByIdAndDelete(req.params.id);
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    res.json({ message: 'Defect deleted successfully' });
  } catch (error) {
    console.error('Error deleting defect:', error);
    res.status(500).json({ message: 'Error deleting defect' });
  }
});

// Helper function to get next defect number
async function getNextDefectNumber(projectId) {
  const highestDefect = await Defect.findOne({ projectId })
    .sort({ defectNumber: -1 })
    .select('defectNumber');
  return highestDefect ? highestDefect.defectNumber + 1 : 1;
}

module.exports = router; 