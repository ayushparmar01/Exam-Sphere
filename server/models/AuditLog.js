const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'EXAM_CREATED',
        'EXAM_UPDATED',
        'EXAM_PUBLISHED',
        'EXAM_ARCHIVED',
        'EXAM_DELETED',
        'QUESTION_CREATED',
        'QUESTION_UPDATED',
        'QUESTION_DELETED',
        'BULK_UPLOAD',
        'ATTEMPT_RESET',
        'SYSTEM_SEED',
      ],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['EXAM', 'QUESTION', 'ATTEMPT', 'USER', 'SYSTEM'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
