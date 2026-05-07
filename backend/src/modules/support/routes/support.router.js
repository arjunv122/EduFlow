const express = require('express');
const {
  raiseTicket, getMyTickets, getAssignedTickets, respondToTicket, closeTicket
} = require('../controllers/support.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Everyone
router.post('/', raiseTicket);
router.get('/my', getMyTickets);
router.put('/:id/respond', respondToTicket);
router.put('/:id/close', closeTicket);

// Faculty & Admin: view tickets assigned to them
router.get('/assigned', requireRole('faculty', 'admin', 'superadmin'), getAssignedTickets);

module.exports = router;
