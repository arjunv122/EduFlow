const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
  remarks: { type: String, default: '' },
}, { _id: false });

const attendanceSessionSchema = new mongoose.Schema({
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
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Is this a substitute faculty session?
  isSubstitute: { type: Boolean, default: false },
  substituteFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  date: {
    type: Date,
    required: true,
  },
  // Scheduled time
  startTime: { type: String }, // "09:00"
  endTime: { type: String },   // "10:00"
  method: {
    type: String,
    enum: ['manual', 'qr', 'geo', 'face'],
    default: 'manual',
  },
  // QR specific
  qrCode: { type: String, default: null },
  qrExpiresAt: Date,
  records: [attendanceRecordSchema],
  isSubmitted: { type: Boolean, default: false },
  submittedAt: Date,
}, {
  timestamps: true,
});

// Unique session per class per date per time slot
attendanceSessionSchema.index(
  { classSection: 1, date: 1, startTime: 1 },
  { unique: true }
);

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
