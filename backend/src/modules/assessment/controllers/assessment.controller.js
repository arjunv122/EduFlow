const assessmentService = require('../services/assessment.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

// ═══════════════════════════════════════════════════════════════════
//  QUIZ CONTROLLERS
// ═══════════════════════════════════════════════════════════════════

const createQuiz = async (req, res, next) => {
  try {
    const result = await assessmentService.createQuiz(getInstId(req), req.user._id, req.body);
    sendSuccess(res, result, 'Quiz created successfully', 201);
  } catch (error) { next(error); }
};

const getQuizzes = async (req, res, next) => {
  try {
    const { classSectionId } = req.query;
    const result = await assessmentService.getQuizzes(getInstId(req), classSectionId, req.user.role, req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const startQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const result = await assessmentService.startQuizAttempt(getInstId(req), req.user._id, quizId);

    // Safety: strip correct answers before sending to student
    if (req.user.role === 'student' && result.quiz.questions) {
      result.quiz = result.quiz.toObject();
      result.quiz.questions.forEach(q => {
        delete q.correctAnswer;
        if (q.options) {
          q.options.forEach(o => delete o.isCorrect);
        }
      });
    }

    sendSuccess(res, result, 'Quiz attempt started');
  } catch (error) { next(error); }
};

const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers, autoSubmitted, proctorData } = req.body;
    const result = await assessmentService.submitQuizAttempt(
      getInstId(req), req.user._id, quizId, answers, autoSubmitted, proctorData || {}
    );
    sendSuccess(res, result, 'Quiz submitted successfully');
  } catch (error) { next(error); }
};

const getQuizAttempts = async (req, res, next) => {
  try {
    const result = await assessmentService.getQuizAttempts(getInstId(req), req.params.quizId);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const publishQuizResults = async (req, res, next) => {
  try {
    const result = await assessmentService.publishQuizResults(getInstId(req), req.params.quizId);
    sendSuccess(res, result, 'Results published');
  } catch (error) { next(error); }
};

// Student: get their own attempt for a quiz
const getMyAttempt = async (req, res, next) => {
  try {
    const QuizAttempt = require('../models/QuizAttempt');
    const attempt = await QuizAttempt.findOne({
      quiz: req.params.quizId,
      student: req.user._id,
      institution: getInstId(req),
    }).populate('quiz', 'title totalMarks passingMarks showResultImmediately questions');
    // Must convert Mongoose doc to plain object for sendSuccess's Object.assign to work
    sendSuccess(res, attempt ? attempt.toObject() : null);
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════
//  ASSIGNMENT CONTROLLERS
// ═══════════════════════════════════════════════════════════════════

const createAssignment = async (req, res, next) => {
  try {
    const result = await assessmentService.createAssignment(getInstId(req), req.user._id, req.body);
    sendSuccess(res, result, 'Assignment created successfully', 201);
  } catch (error) { next(error); }
};

const getAssignments = async (req, res, next) => {
  try {
    const result = await assessmentService.getAssignments(getInstId(req), req.user.role, req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const result = await assessmentService.getAssignmentById(getInstId(req), req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Assignment not found' });
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const closeAssignment = async (req, res, next) => {
  try {
    const result = await assessmentService.closeAssignment(getInstId(req), req.params.id);
    sendSuccess(res, result, 'Assignment closed');
  } catch (error) { next(error); }
};

const submitAssignment = async (req, res, next) => {
  try {
    const result = await assessmentService.submitAssignment(getInstId(req), req.user._id, req.params.id, req.body);
    sendSuccess(res, result, 'Assignment submitted successfully', 201);
  } catch (error) { next(error); }
};

const getSubmissions = async (req, res, next) => {
  try {
    const result = await assessmentService.getSubmissions(getInstId(req), req.params.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;
    const result = await assessmentService.gradeSubmission(getInstId(req), req.params.submissionId, req.user._id, marks, feedback);
    sendSuccess(res, result, 'Submission graded');
  } catch (error) { next(error); }
};

const getMySubmission = async (req, res, next) => {
  try {
    const result = await assessmentService.getMySubmission(getInstId(req), req.user._id, req.params.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

module.exports = {
  createQuiz, getQuizzes, startQuiz, submitQuiz, getQuizAttempts, publishQuizResults, getMyAttempt,
  createAssignment, getAssignments, getAssignmentById, closeAssignment,
  submitAssignment, getSubmissions, gradeSubmission, getMySubmission,
};
