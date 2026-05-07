const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  classSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSection',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  instructions: { type: String, default: '' },
  dueDate: { type: Date, default: null }, // null = no due date
  maxMarks: { type: Number, required: true, default: 20 },
  // File submission settings
  allowedFileTypes: [{ type: String }], // ['pdf', 'doc', 'cpp', 'java']
  maxFileSize: { type: Number, default: 10 }, // MB
  maxFiles: { type: Number, default: 3 },
  // Late submission
  lateSubmission: {
    allowed: { type: Boolean, default: false },
    penaltyPercent: { type: Number, default: 10 }, // per day
    maxLateDays: { type: Number, default: 3 },
  },
  allowResubmission: { type: Boolean, default: false },
  // Reference materials attached by faculty
  attachments: [{
    filename: String,
    path: String,
    size: Number,
  }],
  closedAt: { type: Date, default: null }, // When auto/manually closed
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Assignment', assignmentSchema);
