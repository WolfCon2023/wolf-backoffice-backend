const Story = require("../models/Story");

/**
 * Get all stories
 */
exports.getAllStories = async (req, res) => {
  try {
    console.log("📡 Fetching all stories...");
    const stories = await Story.find()
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${stories.length} stories`);
    res.json(stories);
  } catch (error) {
    console.error("❌ Error fetching stories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get stories by project ID
 */
exports.getStoriesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching stories for project ${projectId}...`);
    
    const stories = await Story.find({ project: projectId })
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
    
    const story = await Story.findById(id)
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Found story: ${story.title}`);
    res.json(story);
  } catch (error) {
    console.error("❌ Error fetching story:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Create a new story
 */
exports.createStory = async (req, res) => {
  try {
    console.log("📡 Creating new story:", req.body);
    
    // Add reporter from authenticated user
    const storyData = {
      ...req.body,
      reporter: req.user.id
    };
    
    const story = new Story(storyData);
    await story.save();
    
    console.log(`✅ Story created: ${story.title}`);
    res.status(201).json(story);
  } catch (error) {
    console.error("❌ Error creating story:", error);
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
 * Update a story
 */
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating story ${id}:`, req.body);
    
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
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete a story
 */
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Marking story ${id} as toBeDeleted`);
    
    const story = await Story.findByIdAndUpdate(
      id,
      { toBeDeleted: true, updatedAt: Date.now() },
      { new: true }
    );

    if (!story) {
      console.log(`⚠️ Story ${id} not found`);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`✅ Story marked as deleted: ${story.title}`);
    res.json({ message: "Story marked for deletion successfully" });
  } catch (error) {
    console.error("❌ Error marking story as deleted:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 