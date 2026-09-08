/**
 * Data Retention & Cleanup Service
 * ExamSphere Enterprise Compliance
 */
const ExamSession = require('../models/ExamSession');
const ExamIntegrityEvent = require('../models/ExamIntegrityEvent');
const AuditLog = require('../models/AuditLog');

const DEFAULT_POLICIES = {
  activeSessionExpiryHours: 24,
  integrityEventRetentionDays: 90,
  auditLogRetentionDays: 365,
};

class RetentionService {
  constructor(policies = {}) {
    this.policies = { ...DEFAULT_POLICIES, ...policies };
  }

  /**
   * Expire stale active sessions that have passed their deadline
   */
  async cleanupStaleSessions() {
    const threshold = new Date(Date.now() - this.policies.activeSessionExpiryHours * 60 * 60 * 1000);
    const result = await ExamSession.updateMany(
      { status: 'ACTIVE', expiresAt: { $lt: new Date() }, updatedAt: { $lt: threshold } },
      { $set: { status: 'EXPIRED' } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Purge aged integrity events exceeding the compliance retention window
   */
  async purgeOldIntegrityEvents(retentionDays = this.policies.integrityEventRetentionDays) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await ExamIntegrityEvent.deleteMany({ timestamp: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount, cutoffDate };
  }

  /**
   * Purge old audit logs
   */
  async purgeOldAuditLogs(retentionDays = this.policies.auditLogRetentionDays) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount, cutoffDate };
  }

  /**
   * Get retention summary statistics
   */
  async getRetentionStatus() {
    const totalEvents = await ExamIntegrityEvent.countDocuments();
    const totalLogs = await AuditLog.countDocuments();
    const activeSessions = await ExamSession.countDocuments({ status: 'ACTIVE' });

    return {
      policies: this.policies,
      counts: {
        totalIntegrityEvents: totalEvents,
        totalAuditLogs: totalLogs,
        activeSessions,
      },
    };
  }
}

const retentionService = new RetentionService();
module.exports = {
  retentionService,
  RetentionService,
};
