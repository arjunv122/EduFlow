const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  facultyId: {
    type: String,
    required: true,
    trim: true,
  },
  designation: {
    type: String,
    enum: ['professor', 'associate_professor', 'assistant_professor', 'lecturer', 'visiting_faculty'],
    required: true,
  },
  qualification: { type: String, default: '' },
  specialization: [{ type: String }], // Subject expertise areas
  experience: { type: Number, default: 0 }, // Years
  dateOfBirth: Date,
  joiningDate: Date,
  bio: { type: String, default: '' },
  researchInterests: [{ type: String }],
  officeHours: [{
    day: String,
    startTime: String,
    endTime: String,
    location: String,
  }],
  // For Smart Substitution algorithm
  subjectExpertise: [{ type: String }], // Course codes or subject names
  currentSubstitutionCount: { type: Number, default: 0 }, // This semester
  preferences: {
    notificationEmail: { type: Boolean, default: true },
    attendanceMethod: {
      type: String,
      enum: ['manual', 'qr', 'geo'],
      default: 'manual',
    },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);
