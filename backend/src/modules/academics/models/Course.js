const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  description: { type: String, default: '' },
  credits: { type: Number, required: true, min: 1, max: 10 },
  semester: { type: Number, required: true, min: 1 },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  isActive: { type: Boolean, default: true },
  maxEnrollment: { type: Number, default: 60 },

  // Grading components (weights must sum to 100)
  gradingComponents: {
    assignments: { type: Number, default: 20 },
    quizzes: { type: Number, default: 20 },
    midterm: { type: Number, default: 30 },
    finalExam: { type: Number, default: 30 },
  },
  // SRET email generation fields
  // emailIndex: matches SRET_COURSE_INDEX config (1=AIML, 2=CYBER, 3=AIDA, 4=MEDENG)
  emailIndex: {
    type: Number,
    default: null, // null = email generation not configured for this course
  },
  // registrationCounters: { '26': 12 } — year string → student count that year
  // Used for atomic sequential email generation (findOneAndUpdate $inc)
  registrationCounters: {
    type: Map,
    of: Number,
    default: {},
  },
}, {
  timestamps: true,
});

courseSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);

