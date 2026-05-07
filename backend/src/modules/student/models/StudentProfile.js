const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
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
  studentId: {
    type: String,
    required: true,
    trim: true,
  },
  batchYear: { type: Number }, // e.g., 2023
  currentSemester: { type: Number, default: 1 },
  admissionDate: Date,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male',
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  // Parent details
  parent: {
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
    guardianName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    relation: { type: String, default: 'parent' },
  },
  // Currently enrolled class sections
  enrolledClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSection',
  }],
  // Academic performance cache
  cgpa: { type: Number, default: 0 },
  currentSemesterGPA: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped', 'on_leave'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
