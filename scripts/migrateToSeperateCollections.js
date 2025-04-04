const mongoose = require('mongoose');
require('dotenv').config();

const Story = require('../models/Story');
const Task = require('../models/Task');
const Defect = require('../models/Defect');

const MONGO_URI = 'mongodb://mongo:tEWgucrvGpnciEAbGlGCfKKDggcewdtH@viaduct.proxy.rlwy.net:56486/test?authSource=admin';

async function getNextNumber(Model, projectId) {
  const highestNumber = await Model.findOne({ projectId })
    .sort({ [`${Model.modelName.toLowerCase()}Number`]: -1 })
    .select(`${Model.modelName.toLowerCase()}Number`);
  return highestNumber ? highestNumber[`${Model.modelName.toLowerCase()}Number`] + 1 : 1;
}

async function migrateToSeparateCollections() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Migrate Tasks
    const storyTasks = await Story.find({ type: 'Task' });
    console.log(`Found ${storyTasks.length} tasks to migrate`);

    for (const storyTask of storyTasks) {
      const nextTaskNumber = await getNextNumber(Task, storyTask.project);
      
      const task = new Task({
        taskName: storyTask.title,
        taskDescription: storyTask.description,
        priority: storyTask.priority || 'Medium',
        deadline: storyTask.dueDate,
        assignee: storyTask.assignee,
        status: storyTask.status || 'Open',
        category: 'General',
        progress: 0,
        sprint: storyTask.sprint,
        project: storyTask.project,
        taskNumber: nextTaskNumber,
        createdAt: storyTask.createdAt,
        updatedAt: storyTask.updatedAt
      });

      await task.save();
      console.log(`Migrated task: ${task.taskName}`);
    }

    // Migrate Defects
    const storyDefects = await Story.find({ type: 'Defect' });
    console.log(`Found ${storyDefects.length} defects to migrate`);

    for (const storyDefect of storyDefects) {
      const nextDefectNumber = await getNextNumber(Defect, storyDefect.project);
      
      const defect = new Defect({
        title: storyDefect.title,
        description: storyDefect.description,
        severity: storyDefect.severity || 'Medium',
        status: storyDefect.status || 'Open',
        dateReported: storyDefect.createdAt,
        projectId: storyDefect.project,
        reportedBy: storyDefect.reporter,
        assignedTo: storyDefect.assignee,
        sprint: storyDefect.sprint,
        defectNumber: nextDefectNumber,
        priority: storyDefect.priority || 'Medium',
        createdAt: storyDefect.createdAt,
        updatedAt: storyDefect.updatedAt
      });

      await defect.save();
      console.log(`Migrated defect: ${defect.title}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

migrateToSeparateCollections(); 