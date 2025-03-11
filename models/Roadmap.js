const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeframe: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'At Risk', 'Delayed'],
      default: 'Planned'
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    }],
    epics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic'
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  objectives: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['Business', 'Technical', 'User Experience', 'Other'],
      default: 'Business'
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Achieved', 'At Risk', 'Abandoned'],
      default: 'Not Started'
    },
    keyResults: [{
      description: String,
      targetValue: Number,
      currentValue: Number,
      unit: String,
      dueDate: Date
    }]
  }],
  risks: [{
    title: String,
    description: String,
    probability: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    impact: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    mitigationPlan: String,
    status: {
      type: String,
      enum: ['Identified', 'Analyzing', 'Mitigating', 'Resolved', 'Accepted'],
      default: 'Identified'
    }
  }],
  versions: [{
    name: String,
    releaseDate: Date,
    status: {
      type: String,
      enum: ['Planned', 'In Development', 'Released', 'Delayed'],
      default: 'Planned'
    },
    features: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic'
    }]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
roadmapSchema.index({ project: 1 });
roadmapSchema.index({ owner: 1 });
roadmapSchema.index({ 'timeframe.start': 1 });
roadmapSchema.index({ 'timeframe.end': 1 });
roadmapSchema.index({ 'milestones.dueDate': 1 });
roadmapSchema.index({ 'versions.releaseDate': 1 });

module.exports = mongoose.model("Roadmap", roadmapSchema); 