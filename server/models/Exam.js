const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [300, 'Duration cannot exceed 300 minutes'],
      default: 30,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    totalMarks: {
      type: Number,
      default: 0,
    },
    negativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkPenalty: {
      type: Number,
      default: 0.25,
      min: 0,
    },
    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Medium',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days ahead
    },
    maximumAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    allowRetake: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'LIVE', 'PAUSED', 'ENDED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    // Question Distribution Configuration
    questionDistribution: {
      type: String,
      enum: ['FIXED', 'RANDOM', 'TOPIC_WISE', 'DIFFICULTY_WISE'],
      default: 'FIXED',
    },
    distributionConfig: {
      easyPercent: { type: Number, default: 30 },
      mediumPercent: { type: Number, default: 50 },
      hardPercent: { type: Number, default: 20 },
      topicDistribution: { type: Map, of: Number, default: {} },
    },
    // Specific Students Assigned to this Exam (empty array = all eligible students)
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Immutable frozen question & rule snapshot generated when published
    snapshot: {
      frozenAt: { type: Date },
      questions: [mongoose.Schema.Types.Mixed],
      rules: { type: mongoose.Schema.Types.Mixed },
    },
    // Result Visibility Settings
    showResultImmediately: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    showExplanations: {
      type: Boolean,
      default: true,
    },
    showLeaderboard: {
      type: Boolean,
      default: true,
    },
    showRank: {
      type: Boolean,
      default: true,
    },
    showPercentile: {
      type: Boolean,
      default: true,
    },
    randomizeQuestions: {
      type: Boolean,
      default: true,
    },
    randomizeOptions: {
      type: Boolean,
      default: false,
    },
    // Proctoring & Integrity Configuration
    cameraRequired: {
      type: Boolean,
      default: true,
    },
    cameraMonitoringEnabled: {
      type: Boolean,
      default: true,
    },
    microphoneRequired: {
      type: Boolean,
      default: true,
    },
    microphoneMonitoringEnabled: {
      type: Boolean,
      default: true,
    },
    facePresenceMonitoringEnabled: {
      type: Boolean,
      default: true,
    },
    multipleFaceDetectionEnabled: {
      type: Boolean,
      default: true,
    },
    fullscreenRequired: {
      type: Boolean,
      default: true,
    },
    maxFullscreenExits: {
      type: Number,
      default: 3,
    },
    terminateAfterFullscreenExits: {
      type: Boolean,
      default: false,
    },
    proctoringConfig: {
      lowRiskThreshold: { type: Number, default: 15 },
      mediumRiskThreshold: { type: Number, default: 40 },
      highRiskThreshold: { type: Number, default: 60 },
      maxTabSwitches: { type: Number, default: 5 },
      autoFlagOnHighRisk: { type: Boolean, default: true },
      autoTerminateOnHighRisk: { type: Boolean, default: false },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

examSchema.index({ status: 1, startTime: 1, endTime: 1 });
examSchema.index({ createdBy: 1, status: 1 });

// Helper to determine server-authoritative live status
examSchema.methods.getComputedStatus = function () {
  if (this.status === 'DRAFT' || this.status === 'ARCHIVED' || this.status === 'PAUSED') {
    return this.status;
  }
  const now = new Date();
  if (this.startTime && now < this.startTime) {
    return 'SCHEDULED';
  }
  if (this.endTime && now > this.endTime) {
    return 'ENDED';
  }
  return 'LIVE';
};

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
