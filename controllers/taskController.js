const Story = require("../models/Story");

/**
 * Get all tasks (stories with type = 'Task')
 */
exports.getAllTasks = async (req, res) => {
  try {
    console.log("📡 Fetching all tasks...");
    const tasks = await Story.find({ type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get tasks by project ID
 */
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📡 Fetching tasks for project ${projectId}...`);
    
    const tasks = await Story.find({ project: projectId, type: 'Task' })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key");

    console.log(`✅ Found ${tasks.length} tasks for project ${projectId}`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks by project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get tasks by sprint ID
 */
exports.getTasksBySprint = async (req, res) => {
  try {
    const { sprintId } = req.params;
    console.log(`📡 Fetching tasks for sprint ${sprintId}...`);
    
    const tasks = await Story.find({ sprint: sprintId, type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    console.log(`✅ Found ${tasks.length} tasks for sprint ${sprintId}`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks by sprint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get task by ID
 */
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching task ${id}...`);
    
    const task = await Story.findOne({ _id: id, type: 'Task' })
      .populate("project", "name key")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("epic", "name key")
      .populate("sprint", "name startDate endDate");

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Found task: ${task.title}`);
    res.json(task);
  } catch (error) {
    console.error("❌ Error fetching task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Create a new task
 */
exports.createTask = async (req, res) => {
  try {
    console.log("📡 Creating new task:", req.body);
    
    // Add type and reporter
    const taskData = {
      ...req.body,
      type: 'Task',
      reporter: req.user.id
    };
    
    const task = new Story(taskData);
    await task.save();
    
    console.log(`✅ Task created: ${task.title}`);
    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Error creating task:", error);
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
 * Update a task
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Updating task ${id}:`, req.body);
    
    // Ensure we can't change the type from 'Task'
    const updateData = {
      ...req.body,
      type: 'Task',
      updatedAt: Date.now()
    };
    
    const task = await Story.findOneAndUpdate(
      { _id: id, type: 'Task' },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task updated: ${task.title}`);
    res.json(task);
  } catch (error) {
    console.error("❌ Error updating task:", error);
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
 * Delete a task
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Deleting task ${id}`);
    
    const task = await Story.findOneAndDelete({ _id: id, type: 'Task' });

    if (!task) {
      console.log(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task deleted: ${task.title}`);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 