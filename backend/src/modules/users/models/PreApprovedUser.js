const mongoose = require('mongoose');

const preApprovedUserSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  identifier: { // Roll Number for student, Email for faculty
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['student', 'faculty'],
    required: true,
  },
  isClaimed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Ensure unique identifier per institution
preApprovedUserSchema.index({ institution: 1, identifier: 1 }, { unique: true });

module.exports = mongoose.model('PreApprovedUser', preApprovedUserSchema);
