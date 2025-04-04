const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
    default: 'Open'
  },
  dateReported: {
    type: Date,
    default: Date.now
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  defectNumber: {
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

// Create a compound index for defectNumber
defectSchema.index({ defectNumber: 1 }, { unique: true });

module.exports = mongoose.model('Defect', defectSchema); 