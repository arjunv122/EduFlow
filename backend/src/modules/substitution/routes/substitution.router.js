const express = require('express');
const {
  applyForLeave, processLeave, getPendingSubstitutions, assignSubstitute
} = require('../controllers/substitution.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Faculty routes
router.post('/leave', requireRole('faculty', 'admin'), applyForLeave);

// Admin routes
router.put('/leave/:id/process', requireRole('admin'), processLeave);
router.get('/pending', requireRole('admin'), getPendingSubstitutions);
router.put('/:id/assign', requireRole('admin'), assignSubstitute);

module.exports = router;
