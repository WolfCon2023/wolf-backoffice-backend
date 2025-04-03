const Story = require("../models/Story");
const Project = require("../models/Project");

/**
 * Get all stories
 */
exports.getAllStories = async (req, res) => {
  try {
    console.log("📋 Fetching all stories...");
    const query = {};
    
    // Only filter by type if it's provided in the query
    if (req.query.type) {
      query.type = req.query.type;
    }

    const stories = await Story.find(query)
      .populate("assignee", "firstName lastName email")
      .populate("reporter", "firstName lastName email")
      .populate("project", "name key")
      .populate("sprint", "name startDate endDate");

    console.log(`✅ Found ${stories.length} stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories", error: error.message });
  }
};

/**
 * Get stories by project ID
 */
exports.getStoriesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching stories for project ${projectId}...`);
    
    const stories = await Story.find({ project: projectId, type: 'Feature' })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${stories.length} stories for project ${projectId}`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get story by ID
 */
exports.getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching story ${id}...`);
    
    const story = await Story.findOne({ _id: id, type: 'Feature' })
      .populate("assignee", "firstName lastName email")
      .populate("reporter", "firstName lastName email")
      .populate("project", "name key")
      .populate("sprint", "name startDate endDate");

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Found story: ${story.title}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error fetching story:", error);
    res.status(500).json({ message: "Failed to fetch story", error: error.message });
  }
};

/**
 * Create a new story
 */
exports.createStory = async (req, res) => {
  try {
    console.log("📡 Creating new story:", req.body);
    
    // Get the project to generate the key
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the highest story number for this project
    const highestStory = await Story.findOne({ project: req.body.project })
      .sort({ key: -1 })
      .select('key');

    let nextNumber = 1;
    if (highestStory) {
      const match = highestStory.key.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    // Generate the key in format PROJECT-123
    const key = `${project.key}-${nextNumber}`;
    
    const story = new Story({
      ...req.body,
      key,
      type: req.body.type || 'Feature', // Default to Feature if not specified
      reporter: req.user._id
    });
    
    const savedStory = await story.save();
    
    console.log(`✅ Story created: ${savedStory.title} with key ${savedStory.key}`);
    res.status(201).json(savedStory);
  } catch (error) {
    console.error("❌ Error creating story:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid story data", 
        error: error.message 
      });
    }
    res.status(500).json({ message: "Failed to create story", error: error.message });
  }
};

/**
 * Update a story
 */
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating story ${id}:`, req.body);
    
    // Ensure reporter is present in the update data
    if (!req.body.reporter) {
      return res.status(400).json({ message: "Reporter (User ID) is required" });
    }
    
    const story = await Story.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story updated: ${story.title}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error updating story:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid story data", 
        error: error.message 
      });
    }
    res.status(500).json({ message: "Failed to update story", error: error.message });
  }
};

/**
 * Delete a story
 */
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Marking story ${id} as toBeDeleted`);
    
    const story = await Story.findOneAndDelete({ _id: id, type: 'Feature' });

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story deleted: ${story.title}`);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story", error: error.message });
  }
};

/**
 * Restore a deleted story
 */
exports.restoreStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Restoring story ${id} from deletion`);
    
    const story = await Story.findByIdAndUpdate(
      id,
      { toBeDeleted: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story restored: ${story.title}`);
    res.json({ message: "Story restored successfully", story });
  } catch (error) {
    console.error("❌ Error restoring story:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all deleted stories
 */
exports.getDeletedStories = async (req, res) => {
  try {
    console.log("📡 Fetching all deleted stories");
    const filter = { toBeDeleted: true };
    const stories = await Story.find(filter)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('project', 'name key')
      .populate('epic', 'name');
    
    console.log(`✅ Fetched ${stories.length} deleted stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching deleted stories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update story status
 */
exports.updateStoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
    if (!validStatuses.includes(status)) {
      console.warn(`⚠️ Invalid status provided: ${status}`);
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses
      });
    }

    console.log(`📡 Updating story ${id} status to ${status}`);

    const story = await Story.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story status updated: ${story.title} -> ${status}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error updating story status:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid story data", 
        error: error.message 
      });
    }
    res.status(500).json({ message: "Failed to update story status", error: error.message });
  }
}; 