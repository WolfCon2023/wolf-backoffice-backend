const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    required: true,
    enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  deadline: {
    type: Date
  },
  taskName: {
    type: String,
    required: true
  },
  taskDescription: {
    type: String
  },
  category: {
    type: String,
    enum: ['Development', 'Testing', 'Documentation', 'Design', 'Other'],
    default: 'Development'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
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

module.exports = mongoose.model('Task', taskSchema); 