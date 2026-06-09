const express = require('express');
const {
  register, login, getMe, createSuperAdmin, changePassword, getSretCourses, forgotPassword, resetPassword, getSretInfo
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

// Public: expose SRET institution ID + departments for registration form
router.get('/sret-info', getSretInfo);

// ── Protected routes ───────────────────────────────────────────────
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
