const Sprint = require("../models/Sprint");
const Story = require("../models/Story");

// Get all sprints
const getAllSprints = async (req, res) => {
  try {
    console.log("📡 Fetching all sprints...");

    const sprints = await Sprint.find({ isDeleted: { $ne: true } });
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
};

// Create new sprint
const createSprint = async (req, res) => {
  try {
    console.log("🟢 POST /api/sprints HIT");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    console.log("📡 Creating new sprint:", req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.project || !req.body.startDate || !req.body.endDate) {
      return res.status(400).json({ 
        message: "Name, project, startDate, and endDate are required fields" 
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        message: "Invalid date format for startDate or endDate" 
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ 
        message: "startDate must be before endDate" 
      });
    }

    // Create new sprint
    const sprint = new Sprint({
      name: req.body.name,
      project: req.body.project,
      goal: req.body.goal || "",
      startDate: startDate,
      endDate: endDate,
      status: req.body.status || "PLANNING",
      capacity: req.body.capacity || 0,
      isDeleted: false
    });

    await sprint.save();
    console.log("✅ Sprint created successfully:", sprint.name);
    
    // Populate project details
    await sprint.populate("project", "name key status");
    
    res.status(201).json(sprint);
  } catch (error) {
    console.error("❌ Error creating sprint:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation Error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: "Error creating sprint", error: error.message });
  }
};

// Get sprint by ID
const getSprintById = async (req, res) => {
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
};

// Delete sprint (soft delete)
const deleteSprint = async (req, res) => {
  try {
    console.log(`📡 Deleting sprint ${req.params.id}...`);
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );

    if (!sprint) {
      console.warn("⚠️ Sprint not found or already deleted");
      return res.status(404).json({ message: "Sprint not found" });
    }

    console.log("✅ Sprint marked as deleted");
    res.json({ message: "Sprint deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting sprint:", error);
    res.status(500).json({ message: "Error deleting sprint", error: error.message });
  }
};

// Update sprint
const updateSprint = async (req, res) => {
  try {
    console.log(`📡 Updating sprint ${req.params.id}...`);
    console.log("Update data:", req.body);

    // Validate dates if they are provided
    if (req.body.startDate || req.body.endDate) {
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

      if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
        return res.status(400).json({ 
          message: "Invalid date format for startDate or endDate" 
        });
      }

      if (startDate && endDate && startDate >= endDate) {
        return res.status(400).json({ 
          message: "startDate must be before endDate" 
        });
      }
    }

    // Find and update sprint
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!sprint) {
      console.warn("⚠️ Sprint not found or already deleted");
      return res.status(404).json({ message: "Sprint not found" });
    }

    // Populate project details
    await sprint.populate("project", "name key status");
    
    console.log("✅ Sprint updated successfully:", sprint.name);
    res.json(sprint);
  } catch (error) {
    console.error("❌ Error updating sprint:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation Error", 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: "Error updating sprint", error: error.message });
  }
};

module.exports = {
  getAllSprints,
  createSprint,
  getSprintById,
  deleteSprint,
  updateSprint
}; 