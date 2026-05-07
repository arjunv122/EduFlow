const express = require('express');
const {
  initiateSession, markAttendance, submitSession,
  getMyAttendanceStats, getStudentStatsForFaculty, getMyAttendanceCalendar
} = require('../controllers/attendance.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Faculty routes
router.post('/session', requireRole('faculty', 'admin'), initiateSession);
router.put('/session/:id/mark', requireRole('faculty', 'admin'), markAttendance);
router.put('/session/:id/submit', requireRole('faculty', 'admin'), submitSession);
router.get('/student/:studentId/stats', requireRole('faculty', 'admin'), getStudentStatsForFaculty);

// Student routes
router.get('/me/stats', requireRole('student'), getMyAttendanceStats);
router.get('/me/calendar', requireRole('student'), getMyAttendanceCalendar);

module.exports = router;

