const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Product Owner', 'Scrum Master', 'Team Lead', 'Developer', 'Designer', 'QA', 'Other'],
      default: 'Developer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  capacity: {
    type: Number,
    min: 0,
    default: 0 // Story points per sprint
  },
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  metrics: {
    averageVelocity: { type: Number, default: 0 },
    sprintCompletionRate: { type: Number, default: 0 },
    averageCycleTime: { type: Number, default: 0 },
    memberUtilization: { type: Number, default: 0 }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ projects: 1 });

module.exports = mongoose.model("Team", teamSchema); 