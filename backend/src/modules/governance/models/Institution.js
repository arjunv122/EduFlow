const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['school', 'college', 'university', 'training_center'],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: { type: String },
  website: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },
  // Admin who manages this institution
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Super admin approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: Date,
  rejectionReason: String,

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'expired', 'suspended'],
      default: 'trial',
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    renewsAt: Date,
    maxUsers: { type: Number, default: 50 },
    maxStorage: { type: Number, default: 1 }, // GB
  },

  // Branding
  branding: {
    logo: String,
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#8B5CF6' },
    customDomain: String,
    favicon: String,
  },

  // Academic Configuration
  settings: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    academicYearStart: { type: String, default: 'June' }, // Month name
    gradingSystem: {
      type: String,
      enum: ['percentage', 'cgpa', 'gpa', 'letter'],
      default: 'cgpa',
    },
    minAttendancePercent: { type: Number, default: 75 },
    semestersPerYear: { type: Number, default: 2 },
  },

  // Enabled modules/features
  features: {
    attendance: { type: Boolean, default: true },
    quiz: { type: Boolean, default: true },
    assignments: { type: Boolean, default: true },
    smartSubstitution: { type: Boolean, default: true },
    feeManagement: { type: Boolean, default: false },
    discussionForums: { type: Boolean, default: false },
    library: { type: Boolean, default: false },
    hostel: { type: Boolean, default: false },
    parentPortal: { type: Boolean, default: false },
  },

  // Stats cache
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    totalDepartments: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Institution', institutionSchema);
