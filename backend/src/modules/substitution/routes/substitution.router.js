const express = require('express');
const {
  applyForLeave, processLeave, getPendingSubstitutions, assignSubstitute,
  getMyLeaveRequests, getMySubstitutions
} = require('../controllers/substitution.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Faculty routes — own leave requests and substitutions
router.post('/leave', requireRole('faculty', 'admin'), applyForLeave);
router.get('/my-leaves', requireRole('faculty', 'admin'), getMyLeaveRequests);
router.get('/my-substitutions', requireRole('faculty', 'admin'), getMySubstitutions);

// Admin routes
router.put('/leave/:id/process', requireRole('admin'), processLeave);
router.get('/pending', requireRole('admin'), getPendingSubstitutions);
router.put('/:id/assign', requireRole('admin'), assignSubstitute);

module.exports = router;
