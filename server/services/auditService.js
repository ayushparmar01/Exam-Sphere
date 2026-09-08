const AuditLog = require('../models/AuditLog');

const logAdminAction = async ({ action, performedBy, entityType, entityId, details = {}, req = null }) => {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress || '' : '';
    await AuditLog.create({
      action,
      performedBy,
      entityType,
      entityId: entityId ? entityId.toString() : '',
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
};

module.exports = { logAdminAction };
