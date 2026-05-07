const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  lateDays: { type: Number, default: 0 },
  textResponse: { type: String, default: '' },
  attachments: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
  }],
  // Grading
  marksAwarded: { type: Number, default: null },
  feedback: { type: String, default: '' },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  gradedAt: Date,
  gradedAttachments: [{ // Faculty-annotated files
    filename: String,
    path: String,
  }],
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted',
  },
  isPublished: { type: Boolean, default: false }, // Student can see grade
}, {
  timestamps: true,
});

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
