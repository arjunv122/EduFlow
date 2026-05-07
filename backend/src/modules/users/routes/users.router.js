const express = require('express');
const {
  listUsers, deactivateUser, reactivateUser, activateUser, changeUserRole, bulkImportStudents,
  getPreApprovedUsers, addPreApprovedUser, removePreApprovedUser, deleteUser
} = require('../controllers/users.controller');
const { protect, requirePermission, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// All routes require users.manage permission (admin only)
router.get('/', requirePermission('users.manage'), listUsers);
router.put('/:id/deactivate', requirePermission('users.manage'), deactivateUser);
router.put('/:id/reactivate', requirePermission('users.manage'), reactivateUser);
router.patch('/:id/activate', requirePermission('users.manage'), activateUser);
router.put('/:id/role', requirePermission('users.manage'), changeUserRole);
router.delete('/:id', requirePermission('users.manage'), deleteUser);
router.post('/bulk-import', requirePermission('users.provision'), bulkImportStudents);

router.get('/pre-approve', requirePermission('users.manage'), getPreApprovedUsers);
router.post('/pre-approve', requirePermission('users.manage'), addPreApprovedUser);
router.delete('/pre-approve/:id', requirePermission('users.manage'), removePreApprovedUser);

module.exports = router;
