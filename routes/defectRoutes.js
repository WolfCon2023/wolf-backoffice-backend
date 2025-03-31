const express = require("express");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const verifyToken = require("../middleware/authMiddleware");
const defectController = require('../controllers/defectController');

const router = express.Router();

console.log("✅ Defects API Route Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET all defects
router.get("/", defectController.getAllDefects);

// GET defects by project ID
router.get("/project/:projectId", defectController.getDefectsByProject);

// GET defects by sprint ID
router.get("/sprint/:sprintId", defectController.getDefectsBySprint);

// GET a specific defect by ID
router.get("/:id", defectController.getDefectById);

// POST create a new defect
router.post("/", defectController.createDefect);

// PUT update a defect
router.put("/:id", defectController.updateDefect);

// DELETE a defect
router.delete("/:id", defectController.deleteDefect);

module.exports = router; 