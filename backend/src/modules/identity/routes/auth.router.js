const express = require('express');
const {
  register, login, getMe, createSuperAdmin, changePassword, getSretCourses, forgotPassword, resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../../../middleware/auth.middleware');

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/superadmin/create', createSuperAdmin); // One-time setup
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Public: expose SRET course list for the registration form dropdown
router.get('/sret-courses', getSretCourses);

// ── Protected routes ───────────────────────────────────────────────
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
