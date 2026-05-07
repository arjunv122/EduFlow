const auditService = require('../services/audit.service');
const { sendSuccess } = require('../../../utils/response.util');
const { getInstitutionFilter } = require('../../../utils/institutionFilter');

const getAuditLogs = async (req, res, next) => {
  try {
    const instId = req.user.role === 'superadmin'
      ? req.query.institutionId || null
      : req.user.institution?._id || req.user.institution;

    const { page, limit, startDate, endDate, action } = req.query;
    const result = await auditService.getAuditLogs(instId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      startDate,
      endDate,
      action,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
