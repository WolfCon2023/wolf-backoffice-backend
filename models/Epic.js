const mongoose = require("mongoose");

const epicSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: false
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    default: 'Medium'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Epic'
  }],
  labels: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metrics: {
    totalStoryPoints: { type: Number, default: 0 },
    completedStoryPoints: { type: Number, default: 0 },
    remainingStoryPoints: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stories/tasks associated with this epic
epicSchema.virtual('stories', {
  ref: 'Story',
  localField: '_id',
  foreignField: 'epic'
});

// Indexes
epicSchema.index({ key: 1 }, { unique: true });
epicSchema.index({ project: 1 });
epicSchema.index({ owner: 1 });
epicSchema.index({ status: 1 });
epicSchema.index({ priority: 1 });
epicSchema.index({ startDate: 1 });
epicSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Epic", epicSchema); 