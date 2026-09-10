const mongoose = require('mongoose');

const examIntegrityEventSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'TAB_SWITCH',
        'WINDOW_BLUR',
        'WINDOW_FOCUS',
        'FULLSCREEN_ENTER',
        'FULLSCREEN_EXIT',
        'VISIBILITY_CHANGE',
        'COPY_ATTEMPT',
        'PASTE_ATTEMPT',
        'CUT_ATTEMPT',
        'CONTEXT_MENU_ATTEMPT',
        'DEVTOOLS_HEURISTIC',
        'RECONNECT',
        'MULTIPLE_SESSION',
        'CAMERA_PERMISSION_CHANGED',
        'CAMERA_UNAVAILABLE',
        'CAMERA_STREAM_STOPPED',
        'CAMERA_INTERRUPTED',
        'CAMERA_RESTORED',
        'CAMERA_ACTIVE',
        'CAMERA_DENIED',
        'FACE_ABSENT',
        'MULTIPLE_FACES',
        'MICROPHONE_PERMISSION_CHANGED',
        'MICROPHONE_UNAVAILABLE',
        'MIC_INTERRUPTED',
        'MIC_RESTORED',
        'MIC_ACTIVE',
        'MIC_DENIED',
        'SPEECH_DETECTED',
        'MULTIPLE_VOICES_DETECTED',
        'NETWORK_OFFLINE',
        'NETWORK_RECOVERED',
        'INACTIVITY',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
      index: true,
    },
    riskPoints: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

examIntegrityEventSchema.index({ examId: 1, studentId: 1 });
examIntegrityEventSchema.index({ attemptId: 1, timestamp: 1 });

const ExamIntegrityEvent = mongoose.model('ExamIntegrityEvent', examIntegrityEventSchema);
module.exports = ExamIntegrityEvent;
