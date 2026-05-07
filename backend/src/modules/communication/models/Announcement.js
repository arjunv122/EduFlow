const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  // Who sees this announcement
  audience: {
    type: String,
    enum: ['institution', 'department', 'class', 'specific_users'],
    default: 'institution',
  },
  targetDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  targetClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSection',
    default: null,
  },
  attachments: [{
    filename: String,
    path: String,
  }],
  // Read receipts
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
  scheduledFor: Date, // Schedule future publishing
}, {
  timestamps: true,
});

module.exports = mongoose.model('Announcement', announcementSchema);
