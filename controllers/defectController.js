const mongoose = require("mongoose");
const Story = require("../models/Story");

/**
 * Get all defects
 */
exports.getAllDefects = async (req, res) => {
  try {
    console.log('📋 Fetching all defects...');
    const defects = await Story.find({ type: 'Defect' })
      .populate('reportedBy', 'firstName lastName email')
      .populate('projectId', 'name key');
    
    console.log(`✅ Found ${defects.length} defects`);
    res.json(defects);
  } catch (error) {
    console.error('❌ Error fetching defects:', error);
    res.status(500).json({ message: 'Failed to fetch defects', error: error.message });
  }
};

/**
 * Get defects by project ID
 */
exports.getDefectsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching defects for project ${projectId}...`);
    
    const defects = await Story.find({ project: projectId, type: 'Defect' })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${defects.length} defects for project ${projectId}`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get defects by sprint ID
 */
exports.getDefectsBySprint = async (req, res) => {
  try {
    const { sprintId } = req.params;
    console.log(`📡 Fetching defects for sprint ${sprintId}...`);
    
    const defects = await Story.find({ sprint: sprintId, type: 'Defect' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    console.log(`✅ Found ${defects.length} defects for sprint ${sprintId}`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects by sprint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get defect by ID
 */
exports.getDefectById = async (req, res) => {
  try {
    const defect = await Story.findOne({ _id: req.params.id, type: 'Defect' })
      .populate('reportedBy', 'firstName lastName email')
      .populate('projectId', 'name key');
    
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    
    res.json(defect);
  } catch (error) {
    console.error('❌ Error fetching defect:', error);
    res.status(500).json({ message: 'Failed to fetch defect', error: error.message });
  }
};

/**
 * Create a new defect
 */
exports.createDefect = async (req, res) => {
  try {
    const defect = new Story({
      ...req.body,
      type: 'Defect',
      reportedBy: req.user._id,
      dateReported: Date.now(),
      priority: req.body.priority || 'High' // Default priority for defects is High
    });
    
    const savedDefect = await defect.save();
    console.log('✅ Defect created:', savedDefect.title);
    
    res.status(201).json(savedDefect);
  } catch (error) {
    console.error('❌ Error creating defect:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid defect data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create defect', error: error.message });
  }
};

/**
 * Update a defect
 */
exports.updateDefect = async (req, res) => {
  try {
    const defect = await Story.findOneAndUpdate(
      { _id: req.params.id, type: 'Defect' },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    
    console.log('✅ Defect updated:', defect.title);
    res.json(defect);
  } catch (error) {
    console.error('❌ Error updating defect:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid defect data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update defect', error: error.message });
  }
};

/**
 * Delete a defect
 */
exports.deleteDefect = async (req, res) => {
  try {
    const defect = await Story.findOneAndDelete({ _id: req.params.id, type: 'Defect' });
    
    if (!defect) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    
    console.log('✅ Defect deleted:', defect.title);
    res.json({ message: 'Defect deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting defect:', error);
    res.status(500).json({ message: 'Failed to delete defect', error: error.message });
  }
}; 