const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamIntegrityEvent = require('../models/ExamIntegrityEvent');
const { getIO } = require('../config/socket');

const EVENT_CONFIG = {
  TAB_SWITCH: { points: 5, severity: 'LOW', counter: 'tabSwitches' },
  WINDOW_BLUR: { points: 3, severity: 'LOW', counter: 'windowBlurs' },
  WINDOW_FOCUS: { points: 0, severity: 'LOW', counter: null },
  FULLSCREEN_ENTER: { points: 0, severity: 'LOW', counter: null },
  FULLSCREEN_EXIT: { points: 10, severity: 'MEDIUM', counter: 'fullscreenExits' },
  VISIBILITY_CHANGE: { points: 2, severity: 'LOW', counter: 'tabSwitches' },
  COPY_ATTEMPT: { points: 8, severity: 'MEDIUM', counter: 'copyPasteAttempts' },
  PASTE_ATTEMPT: { points: 8, severity: 'MEDIUM', counter: 'copyPasteAttempts' },
  CUT_ATTEMPT: { points: 8, severity: 'MEDIUM', counter: 'copyPasteAttempts' },
  CONTEXT_MENU_ATTEMPT: { points: 3, severity: 'LOW', counter: 'copyPasteAttempts' },
  DEVTOOLS_HEURISTIC: { points: 25, severity: 'HIGH', counter: null },
  MULTIPLE_SESSION: { points: 30, severity: 'HIGH', counter: 'reconnects' },
  CAMERA_PERMISSION_CHANGED: { points: 5, severity: 'LOW', counter: 'cameraEvents' },
  CAMERA_UNAVAILABLE: { points: 15, severity: 'MEDIUM', counter: 'cameraEvents' },
  CAMERA_STREAM_STOPPED: { points: 15, severity: 'MEDIUM', counter: 'cameraEvents' },
  CAMERA_INTERRUPTED: { points: 15, severity: 'MEDIUM', counter: 'cameraEvents' },
  CAMERA_RESTORED: { points: 0, severity: 'LOW', counter: null },
  CAMERA_ACTIVE: { points: 0, severity: 'LOW', counter: null },
  CAMERA_DENIED: { points: 20, severity: 'HIGH', counter: 'cameraEvents' },
  FACE_ABSENT: { points: 10, severity: 'MEDIUM', counter: 'cameraEvents' },
  MULTIPLE_FACES: { points: 20, severity: 'HIGH', counter: 'cameraEvents' },
  MICROPHONE_PERMISSION_CHANGED: { points: 5, severity: 'LOW', counter: 'microphoneEvents' },
  MICROPHONE_UNAVAILABLE: { points: 15, severity: 'MEDIUM', counter: 'microphoneEvents' },
  MIC_INTERRUPTED: { points: 10, severity: 'MEDIUM', counter: 'microphoneEvents' },
  MIC_RESTORED: { points: 0, severity: 'LOW', counter: null },
  MIC_ACTIVE: { points: 0, severity: 'LOW', counter: null },
  MIC_DENIED: { points: 15, severity: 'MEDIUM', counter: 'microphoneEvents' },
  SPEECH_DETECTED: { points: 10, severity: 'MEDIUM', counter: 'microphoneEvents' },
  MULTIPLE_VOICES_DETECTED: { points: 20, severity: 'HIGH', counter: 'microphoneEvents' },
  NETWORK_OFFLINE: { points: 2, severity: 'LOW', counter: 'reconnects' },
  NETWORK_RECOVERED: { points: 0, severity: 'LOW', counter: null },
  RECONNECT: { points: 1, severity: 'LOW', counter: 'reconnects' },
  INACTIVITY: { points: 5, severity: 'LOW', counter: null },
};

/**
 * Process incoming integrity telemetry event with dynamic risk scoring
 */
const processIntegrityEvent = async ({ attemptId, studentId, eventType, metadata = {} }) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  const exam = await Exam.findById(attempt.examId);
  const examConfig = exam?.proctoringConfig || {
    lowRiskThreshold: 15,
    mediumRiskThreshold: 40,
    highRiskThreshold: 60,
    maxTabSwitches: 5,
    autoFlagOnHighRisk: true,
    autoTerminateOnHighRisk: false,
  };

  const eventRule = EVENT_CONFIG[eventType] || { points: 2, severity: 'LOW', counter: null };
  const riskPoints = eventRule.points;
  const severity = eventRule.severity;

  // 1. Create immutable integrity event
  const integrityEvent = await ExamIntegrityEvent.create({
    studentId,
    attemptId,
    examId: attempt.examId,
    eventType,
    severity,
    riskPoints,
    metadata,
  });

  // 2. Accumulate risk score and update counters
  const newScore = (attempt.integrityRiskScore || 0) + riskPoints;
  attempt.integrityRiskScore = newScore;
  attempt.integrityEventCount = (attempt.integrityEventCount || 0) + 1;

  if (eventRule.counter && attempt.proctoringSummary) {
    attempt.proctoringSummary[eventRule.counter] = (attempt.proctoringSummary[eventRule.counter] || 0) + 1;
  }

  // Device status updates
  if (eventType === 'CAMERA_STREAM_STOPPED' || eventType === 'CAMERA_UNAVAILABLE' || eventType === 'CAMERA_INTERRUPTED') {
    attempt.cameraStatus = 'UNAVAILABLE';
    attempt.cameraState = 'CAMERA_INTERRUPTED';
  } else if (eventType === 'CAMERA_ACTIVE' || eventType === 'CAMERA_RESTORED') {
    attempt.cameraStatus = 'ACTIVE';
    attempt.cameraState = 'CAMERA_ACTIVE';
  } else if (eventType === 'CAMERA_DENIED') {
    attempt.cameraStatus = 'DENIED';
    attempt.cameraState = 'CAMERA_DENIED';
  } else if (eventType === 'CAMERA_PERMISSION_CHANGED' && metadata.status) {
    attempt.cameraStatus = metadata.status;
  }

  if (eventType === 'MICROPHONE_UNAVAILABLE' || eventType === 'MIC_INTERRUPTED') {
    attempt.microphoneStatus = 'UNAVAILABLE';
    attempt.microphoneState = 'MIC_INTERRUPTED';
  } else if (eventType === 'MIC_ACTIVE' || eventType === 'MIC_RESTORED') {
    attempt.microphoneStatus = 'ACTIVE';
    attempt.microphoneState = 'MIC_ACTIVE';
  } else if (eventType === 'MIC_DENIED') {
    attempt.microphoneStatus = 'DENIED';
    attempt.microphoneState = 'MIC_DENIED';
  } else if (eventType === 'MICROPHONE_PERMISSION_CHANGED' && metadata.status) {
    attempt.microphoneStatus = metadata.status;
  }

  if (eventType === 'NETWORK_OFFLINE') {
    attempt.connectionStatus = 'DISCONNECTED';
  } else if (eventType === 'NETWORK_RECOVERED' || eventType === 'RECONNECT') {
    attempt.connectionStatus = 'CONNECTED';
  }

  // 3. Determine dynamic risk level
  let calculatedLevel = 'LOW';
  if (newScore >= examConfig.highRiskThreshold) {
    calculatedLevel = 'HIGH';
  } else if (newScore >= examConfig.mediumRiskThreshold) {
    calculatedLevel = 'MEDIUM';
  }
  attempt.integrityRiskLevel = calculatedLevel;

  // 4. Auto-flagging policy
  if (examConfig.autoFlagOnHighRisk && calculatedLevel === 'HIGH') {
    attempt.isFlaggedForReview = true;
  }

  // 5. Optional auto-terminate policy (default non-destructive)
  if (examConfig.autoTerminateOnHighRisk && calculatedLevel === 'HIGH' && attempt.status === 'IN_PROGRESS') {
    attempt.status = 'TERMINATED';
  }

  // Check fullscreen exit threshold if configured
  if (
    exam?.fullscreenRequired &&
    exam?.terminateAfterFullscreenExits &&
    (attempt.proctoringSummary?.fullscreenExits || 0) >= (exam?.maxFullscreenExits || 3) &&
    attempt.status === 'IN_PROGRESS'
  ) {
    attempt.status = 'TERMINATED';
  }

  await attempt.save();

  // 6. Broadcast real-time delta via Socket.IO to admin monitoring rooms
  try {
    const io = getIO();
    const payload = {
      attemptId: attempt._id,
      studentId,
      examId: attempt.examId,
      eventType,
      severity,
      riskPoints,
      integrityRiskScore: newScore,
      integrityRiskLevel: calculatedLevel,
      isFlaggedForReview: attempt.isFlaggedForReview,
      status: attempt.status,
      cameraStatus: attempt.cameraStatus,
      microphoneStatus: attempt.microphoneStatus,
      connectionStatus: attempt.connectionStatus,
      timestamp: integrityEvent.timestamp,
    };

    io.to(`exam:${attempt.examId}:monitor`).emit('integrity_alert', payload);
    io.to('admin:live_monitor').emit('integrity_alert', payload);
  } catch (socketErr) {
    // Non-fatal socket broadcast failure
  }

  return {
    event: integrityEvent,
    riskScore: newScore,
    riskLevel: calculatedLevel,
    isFlaggedForReview: attempt.isFlaggedForReview,
    status: attempt.status,
  };
};

module.exports = {
  processIntegrityEvent,
  EVENT_CONFIG,
};
