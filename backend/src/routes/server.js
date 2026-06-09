const express = require('express');

// Import module routers
const authRouter = require('../modules/identity/routes/auth.router');
const governanceRouter = require('../modules/governance/routes/governance.router');
const academicsRouter = require('../modules/academics/routes/academics.router');
const facultyRouter = require('../modules/faculty/routes/faculty.router');
const studentRouter = require('../modules/student/routes/student.router');
const attendanceRouter = require('../modules/attendance/routes/attendance.router');
const substitutionRouter = require('../modules/substitution/routes/substitution.router');
const assessmentRouter = require('../modules/assessment/routes/assessment.router');
const communicationRouter = require('../modules/communication/routes/communication.router');
const supportRouter = require('../modules/support/routes/support.router');
const auditRouter = require('../modules/audit/routes/audit.router');
const usersRouter = require('../modules/users/routes/users.router');

const router = express.Router();

// Mount routers
router.use('/auth', authRouter);
router.use('/governance', governanceRouter);
router.use('/academics', academicsRouter);
router.use('/faculty', facultyRouter);
router.use('/student', studentRouter);
router.use('/attendance', attendanceRouter);
router.use('/substitution', substitutionRouter);
router.use('/assessment', assessmentRouter);
router.use('/communication', communicationRouter);
router.use('/support', supportRouter);
router.use('/audit-logs', auditRouter);
router.use('/users', usersRouter);

// Base API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduFlow API is running',
    version: '1.0.0',
  });
});

// Deployment health check — exposes non-sensitive config
router.get('/health', (req, res) => {
  res.json({
    success: true,
    env: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL || '(not set — using localhost fallback)',
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    smtpHost: process.env.SMTP_HOST || '(not set)',
  });
});

module.exports = router;

