const mongoose = require("mongoose");
const Story = require("../models/Story");

/**
 * Get all defects (stories with type = 'Bug')
 */
exports.getAllDefects = async (req, res) => {
  try {
    console.log("📡 Fetching all defects...");
    const defects = await Story.find({ type: 'Bug' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${defects.length} defects`);
    res.json(defects);
  } catch (error) {
    console.error("❌ Error fetching defects:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get defects by project ID
 */
exports.getDefectsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching defects for project ${projectId}...`);
    
    const defects = await Story.find({ project: projectId, type: 'Bug' })
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
    
    const defects = await Story.find({ sprint: sprintId, type: 'Bug' })
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
    const { id } = req.params;
    console.log(`📡 Fetching defect ${id}...`);
    
    const defect = await Story.findOne({ _id: id, type: 'Bug' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Found defect: ${defect.title}`);
    res.json(defect);
  } catch (error) {
    console.error("❌ Error fetching defect:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Create a new defect
 */
exports.createDefect = async (req, res) => {
  try {
    console.log("📡 Creating new defect:", req.body);
    
    // Add type and reporter 
    const defectData = {
      ...req.body,
      type: 'Bug',
      reporter: req.user.id,
      // Set priority to 'High' by default for bugs
      priority: req.body.priority || 'High'
    };
    
    const defect = new Story(defectData);
    await defect.save();
    
    console.log(`✅ Defect created: ${defect.title}`);
    res.status(201).json(defect);
  } catch (error) {
    console.error("❌ Error creating defect:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update a defect
 */
exports.updateDefect = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating defect ${id}:`, req.body);
    
    // Ensure we can't change the type from 'Bug'
    const updateData = {
      ...req.body,
      type: 'Bug',
      updatedAt: Date.now()
    };
    
    const defect = await Story.findOneAndUpdate(
      { _id: id, type: 'Bug' },
      updateData,
      { new: true, runValidators: true }
    );

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Defect updated: ${defect.title}`);
    res.json(defect);
  } catch (error) {
    console.error("❌ Error updating defect:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete a defect
 */
exports.deleteDefect = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Deleting defect ${id}`);
    
    const defect = await Story.findOneAndDelete({ _id: id, type: 'Bug' });

    if (!defect) {
      console.log(`⚠️ Defect ${id} not found`);
      return res.status(404).json({ message: "Defect not found" });
    }

    console.log(`✅ Defect deleted: ${defect.title}`);
    res.json({ message: "Defect deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting defect:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 