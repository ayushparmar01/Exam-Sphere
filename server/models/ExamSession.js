const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISCONNECTED', 'COMPLETED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

examSessionSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt || this.status === 'EXPIRED' || this.status === 'COMPLETED';
};

examSessionSchema.methods.getRemainingSeconds = function () {
  const diff = Math.max(0, Math.floor((new Date(this.expiresAt) - new Date()) / 1000));
  return diff;
};

const ExamSession = mongoose.model('ExamSession', examSessionSchema);
module.exports = ExamSession;
