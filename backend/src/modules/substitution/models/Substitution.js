const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  leaveRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveRequest',
    default: null, // null for reactive (unplanned absence)
  },
  originalFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  substituteFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  // AI Matching scores for the ranked suggestions shown to admin
  aiSuggestions: [{
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number, // 0-100
    breakdown: {
      subjectExpertise: Number, // max 40
      workloadBalance: Number,  // max 30
      qualification: Number,    // max 20
      departmentMatch: Number,  // max 10
    },
    reason: String,
  }],
  // How was this detected?
  detectionType: {
    type: String,
    enum: ['proactive', 'reactive'], // leave request vs absence detection
    default: 'proactive',
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending',
  },
  substituteResponseAt: Date,
  declineReason: { type: String, default: '' },
  // Notifications sent
  notificationsSent: {
    toFaculty: { type: Boolean, default: false },
    toSubstitute: { type: Boolean, default: false },
    toStudents: { type: Boolean, default: false },
    toHOD: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Substitution', substitutionSchema);
