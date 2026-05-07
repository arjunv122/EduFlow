const mongoose = require('mongoose');

// Student's answer for one question
const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, required: true },
  questionType: String,
  selectedOption: String, // For MCQ: option index
  textAnswer: String,    // For short/essay/fill_blank
  isCorrect: { type: Boolean, default: null }, // null until graded
  marksAwarded: { type: Number, default: null },
  facultyFeedback: { type: String, default: '' },
  // Proctoring events
  tabSwitchCount: { type: Number, default: 0 },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
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
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  autoSubmitted: { type: Boolean, default: false }, // Timer ran out
  answers: [answerSchema],
  // Scores
  autoGradedScore: { type: Number, default: 0 }, // MCQ + T/F
  manualGradedScore: { type: Number, default: 0 }, // Subjective
  totalScore: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'graded'],
    default: 'in_progress',
  },
  isPublished: { type: Boolean, default: false }, // Visible to student
  // Proctoring tracking
  tabSwitchCount: { type: Number, default: 0 },
  fullScreenExitCount: { type: Number, default: 0 },
  autoSubmitReason: {
    type: String,
    enum: ['timer', 'tab_switch', 'fullscreen_exit', null],
    default: null,
  },
  // Proctoring log
  proctorLog: [{
    event: String, // "tab_switch", "fullscreen_exit"
    timestamp: Date,
  }],
}, {
  timestamps: true,
});

// One attempt per student per quiz
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
