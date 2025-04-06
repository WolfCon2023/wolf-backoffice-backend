const mongoose = require("mongoose");

const incrementSchema = new mongoose.Schema({
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
  incrementType: {
    type: String,
    enum: ['story', 'task', 'defect'],
    required: true
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Story-specific fields
  storyPoints: {
    type: Number,
    min: 0,
    default: 0
  },
  // Task-specific fields
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  // Defect-specific fields
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  stepsToReproduce: {
    type: String
  },
  environment: {
    type: String
  },
  // Common fields
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
    ref: 'Increment'
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
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
incrementSchema.index({ key: 1 }, { unique: true });
incrementSchema.index({ project: 1 });
incrementSchema.index({ epic: 1 });
incrementSchema.index({ sprint: 1 });
incrementSchema.index({ assignedTo: 1 });
incrementSchema.index({ createdBy: 1 });
incrementSchema.index({ status: 1 });
incrementSchema.index({ priority: 1 });
incrementSchema.index({ incrementType: 1 });
incrementSchema.index({ isDeleted: 1 });

// Virtual for parent-child relationships
incrementSchema.virtual('subtasks', {
  ref: 'Increment',
  localField: '_id',
  foreignField: 'parent'
});

// Create a compound index for filtering by project and increment type
incrementSchema.index({ project: 1, incrementType: 1 });
// Create a compound index for sprint-based queries
incrementSchema.index({ sprint: 1, incrementType: 1 });

module.exports = mongoose.model("Increment", incrementSchema); 