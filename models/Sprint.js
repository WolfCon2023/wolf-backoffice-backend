const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  goal: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNING'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  capacity: {
    type: Number,
    min: 0,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metrics: {
    plannedStoryPoints: { type: Number, default: 0 },
    completedStoryPoints: { type: Number, default: 0 },
    velocity: { type: Number, default: 0 },
    burndownData: [{
      date: Date,
      remainingPoints: Number,
      idealPoints: Number
    }],
    completedStories: { type: Number, default: 0 },
    addedStories: { type: Number, default: 0 },
    removedStories: { type: Number, default: 0 }
  },
  retrospective: {
    summary: String,
    wentWell: [String],
    needsImprovement: [String],
    actionItems: [{
      description: String,
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['Open', 'In Progress', 'Done'],
        default: 'Open'
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stories in this sprint
sprintSchema.virtual('stories', {
  ref: 'Story',
  localField: '_id',
  foreignField: 'sprint'
});

// Indexes
sprintSchema.index({ project: 1 });
sprintSchema.index({ status: 1 });
sprintSchema.index({ startDate: 1 });
sprintSchema.index({ endDate: 1 });

// Method to check if sprint is active
sprintSchema.methods.isActive = function() {
  return this.status === 'IN_PROGRESS';
};

// Method to calculate sprint progress
sprintSchema.methods.calculateProgress = function() {
  if (this.metrics.plannedStoryPoints === 0) return 0;
  return (this.metrics.completedStoryPoints / this.metrics.plannedStoryPoints) * 100;
};

// Method to check if sprint is overdue
sprintSchema.methods.isOverdue = function() {
  return this.status === 'IN_PROGRESS' && new Date() > this.endDate;
};

module.exports = mongoose.model("Sprint", sprintSchema); 