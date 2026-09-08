const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const ExamIntegrityEvent = require('../models/ExamIntegrityEvent');
const Notification = require('../models/Notification');
const { startOrResumeSession } = require('../services/sessionService');
const { calculateResultData } = require('../services/scoringService');
const { analyzePerformance } = require('../services/aiService');
const { processIntegrityEvent } = require('../services/integrityRiskService');
const { sanitizeQuestionForStudent } = require('../utils/helpers');
const { getIO } = require('../config/socket');

// @desc    Start or resume an active exam attempt
// @route   POST /api/attempts/start
const startOrResumeAttempt = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const studentId = req.user._id;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required.',
      });
    }

    const { session, attempt, isResumed, remainingSeconds } = await startOrResumeSession({
      studentId,
      examId,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    const exam = await Exam.findById(examId).select(
      'title subject duration totalMarks negativeMarking passingPercentage cameraRequired cameraMonitoringEnabled microphoneRequired microphoneMonitoringEnabled fullscreenRequired maxFullscreenExits proctoringConfig'
    );

    // Securely sanitize questions for the student (never expose correctAnswer or explanation!)
    const optionOrderMap = attempt.optionOrder || {};
    const sanitizedQuestions = attempt.questionSnapshots.map((snap) => {
      const optOrder = optionOrderMap instanceof Map ? optionOrderMap.get(snap.questionId) : optionOrderMap[snap.questionId];
      return sanitizeQuestionForStudent(snap, optOrder);
    });

    res.status(200).json({
      success: true,
      message: isResumed ? 'Active session resumed.' : 'New exam session started.',
      data: {
        attemptId: attempt._id,
        sessionId: session.sessionId,
        exam: {
          id: exam._id,
          title: exam.title,
          subject: exam.subject,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          negativeMarking: exam.negativeMarking,
          passingPercentage: exam.passingPercentage,
          cameraRequired: !!exam.cameraRequired,
          cameraMonitoringEnabled: !!exam.cameraMonitoringEnabled,
          microphoneRequired: !!exam.microphoneRequired,
          microphoneMonitoringEnabled: !!exam.microphoneMonitoringEnabled,
          fullscreenRequired: !!exam.fullscreenRequired,
          maxFullscreenExits: exam.maxFullscreenExits || 3,
          proctoringConfig: exam.proctoringConfig,
        },
        remainingSeconds,
        questions: sanitizedQuestions,
        answers: attempt.answers,
        currentQuestionIndex: attempt.currentQuestionIndex || 0,
        integrityRiskScore: attempt.integrityRiskScore || 0,
        integrityRiskLevel: attempt.integrityRiskLevel || 'LOW',
        isResumed,
        serverTime: Date.now(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get session details for browser recovery
// @route   GET /api/attempts/:id/session
const getAttemptSession = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found.',
      });
    }

    if (attempt.studentId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this attempt.',
      });
    }

    const session = await ExamSession.findOne({ attemptId: attempt._id });
    const remainingSeconds = session ? session.getRemainingSeconds() : 0;

    const exam = await Exam.findById(attempt.examId).select(
      'title subject duration totalMarks cameraRequired cameraMonitoringEnabled microphoneRequired microphoneMonitoringEnabled fullscreenRequired maxFullscreenExits proctoringConfig'
    );

    // Sanitize questions
    const optionOrderMap = attempt.optionOrder || {};
    const sanitizedQuestions = attempt.questionSnapshots.map((snap) => {
      const optOrder = optionOrderMap instanceof Map ? optionOrderMap.get(snap.questionId) : optionOrderMap[snap.questionId];
      return sanitizeQuestionForStudent(snap, optOrder);
    });

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        exam,
        remainingSeconds,
        questions: sanitizedQuestions,
        answers: attempt.answers,
        currentQuestionIndex: attempt.currentQuestionIndex,
        integrityRiskScore: attempt.integrityRiskScore || 0,
        integrityRiskLevel: attempt.integrityRiskLevel || 'LOW',
        serverTime: Date.now(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-save individual answer (Debounced)
// @route   PUT /api/attempts/:id/answer
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption, markedForReview, visited, currentQuestionIndex, clientTimestamp } = req.body;
    const attemptId = req.params.id;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user._id,
      status: 'IN_PROGRESS',
    });

    if (!attempt) {
      return res.status(400).json({
        success: false,
        message: 'Active attempt not found or already submitted.',
      });
    }

    let answerObj = attempt.answers.find((a) => a.questionId === questionId);
    if (!answerObj) {
      answerObj = {
        questionId,
        selectedOption: null,
        visited: true,
        markedForReview: false,
        savedAt: new Date(),
        clientTimestamp: clientTimestamp || Date.now(),
      };
      attempt.answers.push(answerObj);
    }

    // Timestamp guard: ensure older delayed requests do not overwrite newer state
    if (clientTimestamp && answerObj.clientTimestamp && clientTimestamp < answerObj.clientTimestamp) {
      return res.status(200).json({
        success: true,
        message: 'Ignored stale answer update.',
        savedAt: answerObj.savedAt,
      });
    }

    if (selectedOption !== undefined) {
      answerObj.selectedOption = selectedOption;
    }
    if (markedForReview !== undefined) {
      answerObj.markedForReview = !!markedForReview;
    }
    if (visited !== undefined) {
      answerObj.visited = !!visited;
    }
    answerObj.savedAt = new Date();
    if (clientTimestamp) answerObj.clientTimestamp = clientTimestamp;

    if (currentQuestionIndex !== undefined) {
      attempt.currentQuestionIndex = Number(currentQuestionIndex);
    }
    attempt.lastHeartbeat = new Date();

    await attempt.save();

    // Touch session heartbeat
    await ExamSession.updateOne(
      { attemptId: attempt._id },
      { $set: { lastHeartbeat: new Date() } }
    ).catch(() => {});

    // Broadcast candidate progress update to admin room
    try {
      const io = getIO();
      const answeredCount = attempt.answers.filter((a) => a.selectedOption !== null).length;
      io.to('admin:live_monitor').emit('candidate_progress_delta', {
        attemptId: attempt._id,
        currentQuestionIndex: attempt.currentQuestionIndex,
        answeredCount,
        lastActivity: new Date(),
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Answer auto-saved.',
      savedAt: answerObj.savedAt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Batch synchronize answers from offline queue with timestamp resolution
// @route   PUT /api/attempts/:id/sync-answers
const syncBatchAnswers = async (req, res, next) => {
  try {
    const attemptId = req.params.id;
    const { answers, currentQuestionIndex } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array is required.' });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user._id,
      status: 'IN_PROGRESS',
    });

    if (!attempt) {
      return res.status(400).json({ success: false, message: 'Attempt not active.' });
    }

    let updatedCount = 0;
    const now = new Date();

    answers.forEach((queuedItem) => {
      const { questionId, selectedOption, markedForReview, visited, clientTimestamp } = queuedItem;
      let existing = attempt.answers.find((a) => a.questionId === questionId);

      if (!existing) {
        existing = {
          questionId,
          selectedOption,
          markedForReview: !!markedForReview,
          visited: !!visited,
          savedAt: now,
          clientTimestamp: clientTimestamp || Date.now(),
        };
        attempt.answers.push(existing);
        updatedCount++;
      } else {
        // Only update if queued timestamp is newer or existing timestamp is not set
        if (!existing.clientTimestamp || (clientTimestamp && clientTimestamp >= existing.clientTimestamp)) {
          if (selectedOption !== undefined) existing.selectedOption = selectedOption;
          if (markedForReview !== undefined) existing.markedForReview = !!markedForReview;
          if (visited !== undefined) existing.visited = !!visited;
          existing.savedAt = now;
          if (clientTimestamp) existing.clientTimestamp = clientTimestamp;
          updatedCount++;
        }
      }
    });

    if (currentQuestionIndex !== undefined) {
      attempt.currentQuestionIndex = Number(currentQuestionIndex);
    }
    attempt.lastHeartbeat = now;
    attempt.connectionStatus = 'CONNECTED';

    await attempt.save();

    res.status(200).json({
      success: true,
      message: `Synchronized ${updatedCount} answers from offline queue.`,
      answers: attempt.answers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record exam integrity event (tab switch, window blur, camera, etc.)
// @route   POST /api/attempts/:id/integrity-event
const recordIntegrityEvent = async (req, res, next) => {
  try {
    const { eventType, metadata } = req.body;
    const attemptId = req.params.id;

    const result = await processIntegrityEvent({
      attemptId,
      studentId: req.user._id,
      eventType: eventType || 'WINDOW_BLUR',
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: 'Integrity telemetry recorded.',
      data: {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        isFlaggedForReview: result.isFlaggedForReview,
        status: result.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Exam Attempt (IDEMPOTENT)
// @route   POST /api/attempts/:id/submit
const submitAttempt = async (req, res, next) => {
  try {
    const attemptId = req.params.id;
    const studentId = req.user._id;
    const { timeSpentSeconds, submissionId } = req.body;

    // Atomic find and update: transitions status from IN_PROGRESS to SUBMITTED
    const attempt = await ExamAttempt.findOneAndUpdate(
      { _id: attemptId, studentId, status: 'IN_PROGRESS' },
      {
        $set: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          ...(submissionId && { submissionId }),
          ...(timeSpentSeconds && { timeSpentSeconds }),
        },
      },
      { new: true }
    );

    // If attempt is null, check if already submitted (IDEMPOTENCY GUARD)
    if (!attempt) {
      const existingResult = await Result.findOne({ attemptId, studentId });
      if (existingResult) {
        return res.status(200).json({
          success: true,
          message: 'Exam already submitted. Returning existing result.',
          data: existingResult,
        });
      }

      // Check if attempt exists but timed out
      const timedOutAttempt = await ExamAttempt.findOne({ _id: attemptId, studentId });
      if (!timedOutAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Attempt not found.',
        });
      }
    }

    // Close ExamSession
    await ExamSession.updateOne(
      { attemptId },
      { $set: { status: 'COMPLETED' } }
    ).catch(() => {});

    const exam = await Exam.findById(attempt.examId);

    // Evaluate scoring securely on backend using frozen snapshots
    const resultData = calculateResultData({ attempt, exam });

    // Generate AI / Rule-based recommendations
    const aiAnalysis = await analyzePerformance({
      result: resultData,
      exam,
    });

    // Create Result document
    const result = await Result.create({
      attemptId: attempt._id,
      studentId,
      examId: exam._id,
      ...resultData,
      aiAnalysis,
    });

    // Update student User stats
    const allUserResults = await Result.find({ studentId });
    const totalCompleted = allUserResults.length;
    const avgScore = Math.round((allUserResults.reduce((sum, r) => sum + r.percentage, 0) / totalCompleted) * 10) / 10;
    const totalCorrect = allUserResults.reduce((sum, r) => sum + r.correctCount, 0);
    const totalQuestions = allUserResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100 * 10) / 10 : 0;
    const bestScore = Math.max(...allUserResults.map((r) => r.percentage), 0);

    await User.findByIdAndUpdate(studentId, {
      $set: {
        'stats.testsCompleted': totalCompleted,
        'stats.averageScore': avgScore,
        'stats.accuracy': accuracy,
        'stats.bestScore': bestScore,
        'stats.totalCorrect': totalCorrect,
        'stats.totalQuestions': totalQuestions,
      },
    });

    // Create notification
    await Notification.create({
      userId: studentId,
      title: 'Assessment Evaluated',
      message: `Your result for ${exam.title} is ready. Score: ${result.score}/${result.totalMarks} (${result.percentage}%).`,
      type: 'RESULT_AVAILABLE',
      link: `/results/${attempt._id}`,
    });

    // Broadcast candidate submission status to admin room
    try {
      const io = getIO();
      io.to('admin:live_monitor').emit('candidate_status_change', {
        attemptId: attempt._id,
        status: 'SUBMITTED',
        score: result.score,
        percentage: result.percentage,
        isPassed: result.isPassed,
      });
    } catch (e) {}

    // Filter result according to Exam Result Visibility Settings
    const safeResult = result.toObject();
    if (!exam.showCorrectAnswers) {
      safeResult.questionReview = safeResult.questionReview.map((q) => ({
        ...q,
        correctAnswer: 'Hidden per examination policy',
      }));
    }
    if (!exam.showExplanations) {
      safeResult.questionReview = safeResult.questionReview.map((q) => ({
        ...q,
        explanation: 'Explanations withheld until evaluation window concludes.',
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully.',
      data: safeResult,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startOrResumeAttempt,
  getAttemptSession,
  saveAnswer,
  syncBatchAnswers,
  recordIntegrityEvent,
  submitAttempt,
};
