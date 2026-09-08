const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const ExamIntegrityEvent = require('../models/ExamIntegrityEvent');
const AuditLog = require('../models/AuditLog');
const { paginateQuery } = require('../utils/helpers');
const { calculateResultData } = require('../services/scoringService');
const { retentionService } = require('../services/retentionService');

// @desc    Get all students (Admin)
// @route   GET /api/admin/students
const getAllStudents = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const filter = { role: 'STUDENT' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const result = await paginateQuery(User, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      select: '-passwordHash',
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all attempts with telemetry (Admin)
// @route   GET /api/admin/attempts
const getAllAttempts = async (req, res, next) => {
  try {
    const { examId, status, riskLevel, flaggedOnly, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (examId) filter.examId = examId;
    if (status) filter.status = status;
    if (riskLevel) filter.integrityRiskLevel = riskLevel;
    if (flaggedOnly === 'true') filter.isFlaggedForReview = true;

    const result = await paginateQuery(ExamAttempt, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'studentId', select: 'name email avatar' },
        { path: 'examId', select: 'title subject duration' },
      ],
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get real-time live monitoring metrics for an exam or all exams
// @route   GET /api/admin/monitoring/live
const getLiveExamMonitoring = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const filter = examId ? { examId } : {};

    const [
      totalCandidates,
      activeCandidates,
      submittedCandidates,
      timedOutCandidates,
      disconnectedCandidates,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      cameraUnavailableCount,
      micUnavailableCount,
    ] = await Promise.all([
      ExamAttempt.countDocuments(filter),
      ExamAttempt.countDocuments({ ...filter, status: 'IN_PROGRESS' }),
      ExamAttempt.countDocuments({ ...filter, status: 'SUBMITTED' }),
      ExamAttempt.countDocuments({ ...filter, status: 'TIMED_OUT' }),
      ExamAttempt.countDocuments({ ...filter, status: 'IN_PROGRESS', connectionStatus: 'DISCONNECTED' }),
      ExamAttempt.countDocuments({ ...filter, integrityRiskLevel: 'LOW' }),
      ExamAttempt.countDocuments({ ...filter, integrityRiskLevel: 'MEDIUM' }),
      ExamAttempt.countDocuments({ ...filter, integrityRiskLevel: 'HIGH' }),
      ExamAttempt.countDocuments({ ...filter, status: 'IN_PROGRESS', cameraStatus: { $in: ['UNAVAILABLE', 'PERMISSION_DENIED'] } }),
      ExamAttempt.countDocuments({ ...filter, status: 'IN_PROGRESS', microphoneStatus: { $in: ['UNAVAILABLE', 'PERMISSION_DENIED'] } }),
    ]);

    // Fetch active & recent attempts for monitoring grid
    const candidates = await ExamAttempt.find(filter)
      .populate('studentId', 'name email avatar')
      .populate('examId', 'title duration')
      .sort({ updatedAt: -1 })
      .limit(100);

    const now = Date.now();
    const candidateList = candidates.map((att) => {
      const remainingSeconds = Math.max(0, Math.floor((new Date(att.expiresAt).getTime() - now) / 1000));
      const answeredCount = att.answers ? att.answers.filter((a) => a.selectedOption !== null).length : 0;
      const totalQuestions = att.questionSnapshots ? att.questionSnapshots.length : 0;

      return {
        _id: att._id,
        attemptId: att._id,
        student: att.studentId,
        exam: att.examId,
        status: att.status,
        remainingSeconds: att.status === 'IN_PROGRESS' ? remainingSeconds : 0,
        currentQuestionIndex: att.currentQuestionIndex || 0,
        totalQuestions,
        answeredCount,
        integrityRiskScore: att.integrityRiskScore || 0,
        integrityRiskLevel: att.integrityRiskLevel || 'LOW',
        integrityEventCount: att.integrityEventCount || 0,
        isFlaggedForReview: !!att.isFlaggedForReview,
        proctoringSummary: att.proctoringSummary,
        cameraStatus: att.cameraStatus || 'NOT_REQUIRED',
        microphoneStatus: att.microphoneStatus || 'NOT_REQUIRED',
        connectionStatus: att.connectionStatus || 'CONNECTED',
        lastHeartbeat: att.lastHeartbeat || att.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalCandidates,
          activeCandidates,
          submittedCandidates,
          timedOutCandidates,
          disconnectedCandidates,
          lowRiskCount,
          mediumRiskCount,
          highRiskCount,
          cameraUnavailableCount,
          micUnavailableCount,
        },
        candidates: candidateList,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single attempt with full integrity timeline (Admin)
// @route   GET /api/admin/attempts/:id
const getAttemptDetails = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
      .populate('studentId', 'name email avatar')
      .populate('examId', 'title subject duration');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const integrityEvents = await ExamIntegrityEvent.find({ attemptId: attempt._id })
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      data: {
        attempt,
        integrityEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle candidate attempt flag for administrator review
// @route   PATCH /api/admin/attempts/:id/flag
const toggleAttemptFlag = async (req, res, next) => {
  try {
    const { isFlagged } = req.body;
    const attempt = await ExamAttempt.findByIdAndUpdate(
      req.params.id,
      { $set: { isFlaggedForReview: isFlagged !== undefined ? isFlagged : true } },
      { new: true }
    );

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Attempt flag updated to ${attempt.isFlaggedForReview}.`,
      data: attempt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get data retention status and trigger manual cleanup
// @route   GET /api/admin/retention
const getRetentionInfo = async (req, res, next) => {
  try {
    const status = await retentionService.getRetentionStatus();
    res.status(200).json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};

// @desc    Get audit logs (Admin)
// @route   GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const result = await paginateQuery(AuditLog, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'performedBy', select: 'name email role' },
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getAllAttempts,
  getLiveExamMonitoring,
  getAttemptDetails,
  toggleAttemptFlag,
  getRetentionInfo,
  getAuditLogs,
};
