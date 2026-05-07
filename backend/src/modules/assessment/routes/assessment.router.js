const express = require('express');
const {
  createQuiz, getQuizzes, startQuiz, submitQuiz, getQuizAttempts, publishQuizResults,
  createAssignment, getAssignments, getAssignmentById, closeAssignment,
  submitAssignment, getSubmissions, gradeSubmission, getMySubmission,
} = require('../controllers/assessment.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// ── Quiz Routes ──────────────────────────────────────────────────────
// Faculty routes
router.post('/quizzes', requireRole('faculty', 'admin'), createQuiz);
router.get('/quizzes/manage', requireRole('faculty', 'admin'), getQuizzes);
router.get('/quiz/:quizId/attempts', requireRole('faculty', 'admin'), getQuizAttempts);
router.put('/quiz/:quizId/publish-results', requireRole('faculty', 'admin'), publishQuizResults);

// Student routes
router.get('/quizzes', requireRole('student', 'faculty', 'admin'), getQuizzes);
router.post('/quizzes/:quizId/start', requireRole('student'), startQuiz);
router.post('/quizzes/:quizId/submit', requireRole('student'), submitQuiz);

// ── Assignment Routes ────────────────────────────────────────────────
// Faculty routes
router.post('/assignments', requireRole('faculty', 'admin'), createAssignment);
router.put('/assignments/:id/close', requireRole('faculty', 'admin'), closeAssignment);
router.get('/assignments/:id/submissions', requireRole('faculty', 'admin'), getSubmissions);
router.put('/submissions/:submissionId/grade', requireRole('faculty', 'admin'), gradeSubmission);

// Shared routes
router.get('/assignments', requireRole('student', 'faculty', 'admin'), getAssignments);
router.get('/assignments/:id', requireRole('student', 'faculty', 'admin'), getAssignmentById);

// Student routes
router.post('/assignments/:id/submit', requireRole('student'), submitAssignment);
router.get('/assignments/:id/my-submission', requireRole('student'), getMySubmission);

module.exports = router;
