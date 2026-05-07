const mongoose = require('mongoose');

// Single question schema
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer', 'essay', 'fill_blank'],
    required: true,
  },
  options: [{ // For MCQ
    text: String,
    isCorrect: { type: Boolean, default: false },
  }],
  correctAnswer: String, // For true_false: "true"/"false", fill_blank: answer text
  marks: { type: Number, required: true, default: 1 },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  topic: { type: String, default: '' },
  explanation: { type: String, default: '' }, // Shown after grading
}, { _id: true });

const quizSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  classSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSection',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  questions: [questionSchema],
  // Timing
  duration: { type: Number, required: true }, // minutes
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  // Settings
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  randomizeQuestions: { type: Boolean, default: false },
  showResultImmediately: { type: Boolean, default: true },
  allowReview: { type: Boolean, default: true },
  // Proctoring
  proctoring: {
    enabled: { type: Boolean, default: false },
    tabSwitchDetection: { type: Boolean, default: true },
    fullScreenEnforcement: { type: Boolean, default: true },
    autoSubmitOnSwitch: { type: Boolean, default: true },
    preventCopyPaste: { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
    default: 'draft',
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Auto-calculate total marks before save
quizSchema.pre('save', function () {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
});

module.exports = mongoose.model('Quiz', quizSchema);
