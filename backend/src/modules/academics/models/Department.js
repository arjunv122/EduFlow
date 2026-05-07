const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    uppercase: true,
    trim: true,
  },
  description: { type: String, default: '' },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Compound unique index: code must be unique per institution
departmentSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
