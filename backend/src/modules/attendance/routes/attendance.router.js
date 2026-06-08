const express = require('express');
const {
  initiateSession, markAttendance, submitSession,
  getMyAttendanceStats, getMyStatsAllCourses, getStudentStatsForFaculty, getMyAttendanceCalendar,
  exportReport
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

// Report export — faculty (own classes) and admin (all classes)
router.get('/reports/export', requireRole('faculty', 'admin'), exportReport);

// Student routes
router.get('/me/stats', requireRole('student'), getMyAttendanceStats);
router.get('/me/stats/all-courses', requireRole('student'), getMyStatsAllCourses);
router.get('/me/calendar', requireRole('student'), getMyAttendanceCalendar);

module.exports = router;
