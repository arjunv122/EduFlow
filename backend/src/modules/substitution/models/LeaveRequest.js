const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ['medical', 'personal', 'conference', 'emergency', 'other'],
    default: 'other',
  },
  // Classes affected during the leave period
  affectedClasses: [{
    classSection: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    date: Date,
    startTime: String,
    endTime: String,
    substitutionStatus: {
      type: String,
      enum: ['pending', 'assigned', 'cancelled'],
      default: 'pending',
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: Date,
  adminRemarks: { type: String, default: '' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
