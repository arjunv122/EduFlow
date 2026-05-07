const mongoose = require('mongoose');

const studentLeaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  leaveType: {
    type: String,
    enum: ['medical', 'personal', 'family', 'academic', 'other'],
    default: 'personal',
  },
  totalDays: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: Date,
  remarks: { type: String, default: '' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudentLeave', studentLeaveSchema);
