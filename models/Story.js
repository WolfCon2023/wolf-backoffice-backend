const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Feature', 'Defect', 'Task', 'Epic']
  },
  storyPoints: {
    type: Number,
    min: 0
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
    default: 'PLANNING'
  },
  description: {
    type: String
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  toBeDeleted: {
    type: Boolean,
    default: false
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
storySchema.index({ type: 1 });
storySchema.index({ toBeDeleted: 1 });

module.exports = mongoose.model("Story", storySchema); 