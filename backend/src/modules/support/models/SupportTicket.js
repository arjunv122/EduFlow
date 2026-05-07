const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'academic_doubt',
      'assignment_help',
      'grade_query',
      'attendance_issue',
      'quiz_issue',
      'technical_issue',
      'login_problem',
      'fee_issue',
      'other',
    ],
    required: true,
  },
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  attachments: [{
    filename: String,
    path: String,
    size: Number,
  }],
  // Conversation thread
  responses: [{
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    attachments: [{ filename: String, path: String }],
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }, // Staff-only note
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
    default: 'open',
  },
  // Auto-routing type
  routedTo: {
    type: String,
    enum: ['faculty', 'admin', 'support_team'],
    default: 'faculty',
  },
  resolvedAt: Date,
  satisfactionRating: { type: Number, min: 1, max: 5, default: null },
  satisfactionFeedback: { type: String, default: '' },
  firstResponseAt: Date,
  responseTimeMinutes: Number,
}, {
  timestamps: true,
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
