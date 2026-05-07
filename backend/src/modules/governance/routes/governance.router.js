const express = require('express');
const {
  registerInstitution,
  getAllInstitutions,
  getInstitution,
  approveInstitution,
  setInstitutionAdmin
} = require('../controllers/governance.controller');
const { protect, requireRole } = require('../../../middleware/auth.middleware');

const router = express.Router();

// Public: Anyone can register an institution
router.post('/register', registerInstitution);

// Superadmin only
router.get('/', protect, requireRole('superadmin'), getAllInstitutions);
router.get('/:id', protect, requireRole('superadmin', 'admin'), getInstitution); // Allow admin to view their own
router.put('/:id/approve', protect, requireRole('superadmin'), approveInstitution);
router.put('/:id/admin', protect, requireRole('superadmin'), setInstitutionAdmin);

// Settings update (Admin for their own, Superadmin for any)
const { updateInstitution } = require('../controllers/governance.controller');
router.put('/:id', protect, requireRole('superadmin', 'admin'), updateInstitution);

module.exports = router;
