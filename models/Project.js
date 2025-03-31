const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { 
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
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  startDate: { 
    type: Date,
    required: true 
  },
  targetEndDate: { 
    type: Date,
    required: true 
  },
  actualEndDate: { 
    type: Date 
  },
  methodology: {
    type: String,
    enum: ['Agile', 'Waterfall', 'Hybrid'],
    default: 'Agile'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  visibility: {
    type: String,
    enum: ['Public', 'Private', 'Team Only'],
    default: 'Team Only'
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metrics: {
    velocity: { type: Number, default: 0 },
    completedStoryPoints: { type: Number, default: 0 },
    totalStoryPoints: { type: Number, default: 0 },
    avgCycleTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for epics associated with this project
projectSchema.virtual('epics', {
  ref: 'Epic',
  localField: '_id',
  foreignField: 'project'
});

// Virtual for sprints associated with this project
projectSchema.virtual('sprints', {
  ref: 'Sprint',
  localField: '_id',
  foreignField: 'project'
});

// Indexes
projectSchema.index({ key: 1 }, { unique: true });
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1 });
projectSchema.index({ targetEndDate: 1 });

module.exports = mongoose.model("Project", projectSchema); 