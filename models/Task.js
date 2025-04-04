const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true
  },
  taskDescription: {
    type: String
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
  deadline: {
    type: Date
  },
  assignee: {
    type: String
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'Planning'
  },
  category: {
    type: String,
    default: 'Development'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  taskNumber: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for taskNumber
taskSchema.index({ taskNumber: 1 }, { unique: true });

module.exports = mongoose.model('Task', taskSchema); 