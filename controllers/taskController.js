const Story = require('../models/Story');

console.log("🚀 Loading taskController...");

/**
 * Get all tasks
 */
exports.getAllTasks = async (req, res) => {
  try {
    console.log('📋 Fetching all tasks...');
    const tasks = await Story.find({ type: 'Task' })
      .populate('assignee', 'firstName lastName email');
    
    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

/**
 * Get a single task by ID
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Story.findOne({ _id: req.params.id, type: 'Task' })
      .populate('assignee', 'firstName lastName email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('❌ Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
};

/**
 * Create a new task
 */
exports.createTask = async (req, res) => {
  try {
    const task = new Story({
      ...req.body,
      type: 'Task',
      createdAt: Date.now()
    });
    
    const savedTask = await task.save();
    console.log('✅ Task created:', savedTask.taskName);
    
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('❌ Error creating task:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid task data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

/**
 * Update a task
 */
exports.updateTask = async (req, res) => {
  try {
    const task = await Story.findOneAndUpdate(
      { _id: req.params.id, type: 'Task' },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log('✅ Task updated:', task.taskName);
    res.json(task);
  } catch (error) {
    console.error('❌ Error updating task:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid task data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

/**
 * Delete a task
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Story.findOneAndDelete({ _id: req.params.id, type: 'Task' });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log('✅ Task deleted:', task.taskName);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
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
      .populate("assignee", "firstName lastName email")
      .populate("reporter", "firstName lastName email")
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
      .populate("assignee", "firstName lastName email")
      .populate("reporter", "firstName lastName email");

    console.log(`✅ Found ${tasks.length} tasks for sprint ${sprintId}`);
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks by sprint:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

console.log("✅ taskController loaded with methods:", Object.keys(exports)); 