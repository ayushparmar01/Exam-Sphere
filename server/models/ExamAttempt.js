const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
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
    attemptNumber: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'ABANDONED', 'TERMINATED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    submissionId: {
      type: String,
      index: true,
    },
    // Immutable frozen question snapshots captured when attempt began
    questionSnapshots: [
      {
        questionId: { type: String, required: true },
        version: { type: Number, default: 1 },
        questionText: { type: String, required: true },
        options: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
          },
        ],
        correctAnswer: { type: String, required: true }, // Kept secure on server
        explanation: { type: String, required: true },
        subject: { type: String, required: true },
        topic: { type: String, required: true },
        difficulty: { type: String, default: 'Medium' },
        marks: { type: Number, default: 1 },
        negativeMarks: { type: Number, default: 0 },
      },
    ],
    // Deterministic question and option sequence preserved across refreshes
    questionOrder: [{ type: String }],
    optionOrder: {
      type: Map,
      of: [String],
      default: {},
    },
    // Student answers state
    answers: [
      {
        questionId: { type: String, required: true },
        selectedOption: { type: String, default: null }, // e.g. 'A' or null
        visited: { type: Boolean, default: false },
        markedForReview: { type: Boolean, default: false },
        savedAt: { type: Date, default: Date.now },
        clientTimestamp: { type: Number },
      },
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    // Proctoring & Integrity Telemetry State
    integrityRiskScore: {
      type: Number,
      default: 0,
      index: true,
    },
    integrityRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
      index: true,
    },
    integrityEventCount: {
      type: Number,
      default: 0,
    },
    isFlaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    proctoringSummary: {
      tabSwitches: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      windowBlurs: { type: Number, default: 0 },
      copyPasteAttempts: { type: Number, default: 0 },
      cameraEvents: { type: Number, default: 0 },
      microphoneEvents: { type: Number, default: 0 },
      reconnects: { type: Number, default: 0 },
    },
    cameraStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'UNAVAILABLE', 'PERMISSION_DENIED', 'NOT_REQUIRED'],
      default: 'NOT_REQUIRED',
    },
    microphoneStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'UNAVAILABLE', 'PERMISSION_DENIED', 'NOT_REQUIRED'],
      default: 'NOT_REQUIRED',
    },
    connectionStatus: {
      type: String,
      enum: ['CONNECTED', 'RECONNECTING', 'DISCONNECTED'],
      default: 'CONNECTED',
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

examAttemptSchema.index({ studentId: 1, examId: 1, status: 1 });
examAttemptSchema.index({ examId: 1, status: 1 });
examAttemptSchema.index({ examId: 1, integrityRiskLevel: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);
module.exports = ExamAttempt;
