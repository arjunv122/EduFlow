const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null, // null for superadmin actions
  },
  actor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  action: {
    type: String,
    required: true,
    // Examples: 'attendance.submit', 'quiz.publish', 'user.deactivate', 'institution.settings.update'
  },
  entity: {
    type: { type: String, default: '' }, // 'User', 'Quiz', 'AttendanceSession', etc.
    id: { type: String, default: '' },
    label: { type: String, default: '' }, // Human-readable: "John Doe", "Mid-Term Quiz"
  },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Extra context
}, {
  // Immutable — no updatedAt
  timestamps: { createdAt: true, updatedAt: false },
});

// Index for efficient admin queries
auditLogSchema.index({ institution: 1, createdAt: -1 });
auditLogSchema.index({ 'actor.id': 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
