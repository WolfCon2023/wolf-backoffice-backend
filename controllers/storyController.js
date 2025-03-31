const Story = require("../models/Story");

/**
 * Get all stories
 */
exports.getAllStories = async (req, res) => {
  try {
    console.log("📋 Fetching all stories...");
    const stories = await Story.find({ type: 'Feature' })
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
    
    const story = new Story({
      ...req.body,
      type: 'Feature',
      reporter: req.user._id
    });
    
    const savedStory = await story.save();
    
    console.log(`✅ Story created: ${savedStory.title}`);
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
    
    const story = await Story.findOneAndUpdate(
      { _id: id, type: 'Feature' },
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