const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Log an auditable action. Fire-and-forget — never awaited in response paths.
   * @param {Object} req - Express request (for actor + IP extraction)
   * @param {string} action - Action string e.g. 'attendance.submit'
   * @param {string} entityType - Entity type e.g. 'AttendanceSession'
   * @param {string} entityId - Entity ObjectId as string
   * @param {string} entityLabel - Human-readable label
   * @param {Object} metadata - Optional extra context
   */
  async logAction(req, action, entityType = '', entityId = '', entityLabel = '', metadata = {}) {
    const instId = req.user?.institution?._id || req.user?.institution || null;
    return AuditLog.create({
      institution: instId,
      actor: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      action,
      entity: {
        type: entityType,
        id: entityId?.toString() || '',
        label: entityLabel,
      },
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      metadata,
    });
  }

  /**
   * Retrieve paginated audit logs for an institution (admin only).
   */
  async getAuditLogs(institutionId, { page = 1, limit = 50, startDate, endDate, action } = {}) {
    const query = {};
    if (institutionId) query.institution = institutionId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (action) query.action = { $regex: action, $options: 'i' };

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

module.exports = new AuditService();
