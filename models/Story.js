const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Story', 'Task', 'Bug', 'Spike'],
    default: 'Story'
  },
  description: {
    type: String,
    required: false
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  epic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Epic'
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  status: {
    type: String,
    enum: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked'],
    default: 'Backlog'
  },
  priority: {
    type: String,
    enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    default: 'Medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storyPoints: {
    type: Number,
    min: 0,
    default: 0
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }],
  labels: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metrics: {
    timeSpent: { type: Number, default: 0 }, // in minutes
    timeEstimate: { type: Number, default: 0 }, // in minutes
    cycleTime: { type: Number, default: 0 }, // in days
    leadTime: { type: Number, default: 0 } // in days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subtasks
storySchema.virtual('subtasks', {
  ref: 'Story',
  localField: '_id',
  foreignField: 'parent'
});

// Indexes
storySchema.index({ key: 1 }, { unique: true });
storySchema.index({ project: 1 });
storySchema.index({ epic: 1 });
storySchema.index({ sprint: 1 });
storySchema.index({ assignee: 1 });
storySchema.index({ reporter: 1 });
storySchema.index({ status: 1 });
storySchema.index({ priority: 1 });
storySchema.index({ type: 1 });

module.exports = mongoose.model("Story", storySchema); 