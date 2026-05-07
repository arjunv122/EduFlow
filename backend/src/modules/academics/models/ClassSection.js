const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  room: { type: String, default: '' },
  building: { type: String, default: '' },
}, { _id: false });

const classSectionSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  section: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    // e.g., "A", "B", "C"
  },
  classType: {
    type: String,
    enum: ['theory', 'lab', 'tutorial'],
    default: 'theory',
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Students enrolled in this class
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maxStudents: { type: Number, default: 60 },
  schedule: [scheduleSlotSchema],
  academicYear: { type: String, required: true }, // "2025-26"
  semester: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: enrolled count
classSectionSchema.virtual('enrolledCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

// Compound unique: institution + course + section + academicYear + semester
classSectionSchema.index(
  { institution: 1, course: 1, section: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

module.exports = mongoose.model('ClassSection', classSectionSchema);
