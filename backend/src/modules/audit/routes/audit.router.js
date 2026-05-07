const express = require('express');
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect, requirePermission } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Admin and superadmin only — audit.view permission
router.get('/', requirePermission('audit.view'), getAuditLogs);

module.exports = router;
