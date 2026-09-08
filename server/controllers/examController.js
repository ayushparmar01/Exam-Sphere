const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const { paginateQuery } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');

// @desc    Get all exams (for student browse / admin manage)
// @route   GET /api/exams
const getExams = async (req, res, next) => {
  try {
    const { subject, difficulty, status, search, page = 1, limit = 12 } = req.query;
    const filter = {};

    // For non-admin users, don't show DRAFT or ARCHIVED exams
    if (!req.user || req.user.role !== 'ADMIN') {
      filter.status = { $in: ['LIVE', 'SCHEDULED'] };
    } else if (status) {
      filter.status = status;
    }

    if (subject && subject !== 'All') {
      filter.subject = subject;
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const result = await paginateQuery(Exam, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'createdBy', select: 'name email' },
    });

    // If user is a student, attach their attempt status to each exam
    let examsWithUserStatus = result.docs.map((doc) => {
      const examObj = doc.toObject();
      examObj.computedStatus = doc.getComputedStatus();
      return examObj;
    });

    if (req.user && req.user.role === 'STUDENT') {
      const examIds = result.docs.map((e) => e._id);
      const attempts = await ExamAttempt.find({
        studentId: req.user._id,
        examId: { $in: examIds },
      }).select('examId status');

      const attemptMap = {};
      attempts.forEach((a) => {
        if (!attemptMap[a.examId]) attemptMap[a.examId] = [];
        attemptMap[a.examId].push(a);
      });

      examsWithUserStatus = examsWithUserStatus.map((e) => {
        const userAttempts = attemptMap[e._id] || [];
        const hasActiveSession = userAttempts.some((a) => a.status === 'IN_PROGRESS');
        const completedAttempts = userAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length;
        const canAttempt = completedAttempts < (e.maximumAttempts || 1) && (completedAttempts === 0 || e.allowRetake);

        return {
          ...e,
          userAttemptsCount: completedAttempts,
          hasActiveSession,
          canAttempt,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: examsWithUserStatus,
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

// @desc    Get single exam details
// @route   GET /api/exams/:id
const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'questions',
        select: 'subject topic difficulty marks',
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    const examData = exam.toObject();
    examData.computedStatus = exam.getComputedStatus();

    // Attach student-specific attempt info if logged in
    if (req.user && req.user.role === 'STUDENT') {
      const attempts = await ExamAttempt.find({
        studentId: req.user._id,
        examId: exam._id,
      }).sort({ createdAt: -1 });

      const activeSession = await ExamSession.findOne({
        studentId: req.user._id,
        examId: exam._id,
        status: 'ACTIVE',
      });

      const completedAttempts = attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT');
      const canAttempt = completedAttempts.length < (exam.maximumAttempts || 1) && (completedAttempts.length === 0 || exam.allowRetake);

      examData.userAttemptInfo = {
        attemptsCount: completedAttempts.length,
        maximumAttempts: exam.maximumAttempts,
        canAttempt,
        hasActiveSession: !!activeSession,
        activeAttemptId: activeSession ? activeSession.attemptId : null,
      };
    }

    res.status(200).json({
      success: true,
      data: examData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new exam (Admin)
// @route   POST /api/exams
const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      duration,
      questions,
      negativeMarking,
      negativeMarkPenalty,
      passingPercentage,
      difficulty,
      startTime,
      endTime,
      maximumAttempts,
      allowRetake,
      status,
      showResultImmediately,
      showCorrectAnswers,
      showExplanations,
      showLeaderboard,
      showRank,
      showPercentile,
      randomizeQuestions,
      randomizeOptions,
    } = req.body;

    if (!title || !subject || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, and duration are required.',
      });
    }

    // Calculate total marks from questions
    let totalMarks = 0;
    if (questions && questions.length > 0) {
      const questionDocs = await Question.find({ _id: { $in: questions } });
      totalMarks = questionDocs.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subject.trim(),
      duration: Number(duration),
      questions: questions || [],
      totalMarks,
      negativeMarking: !!negativeMarking,
      negativeMarkPenalty: negativeMarkPenalty || 0.25,
      passingPercentage: passingPercentage || 40,
      difficulty: difficulty || 'Medium',
      startTime: startTime || new Date(),
      endTime: endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maximumAttempts: maximumAttempts || 1,
      allowRetake: !!allowRetake,
      status: status || 'LIVE',
      showResultImmediately: showResultImmediately !== false,
      showCorrectAnswers: showCorrectAnswers !== false,
      showExplanations: showExplanations !== false,
      showLeaderboard: showLeaderboard !== false,
      showRank: showRank !== false,
      showPercentile: showPercentile !== false,
      randomizeQuestions: randomizeQuestions !== false,
      randomizeOptions: !!randomizeOptions,
      cameraRequired: !!req.body.cameraRequired,
      cameraMonitoringEnabled: !!req.body.cameraMonitoringEnabled,
      microphoneRequired: !!req.body.microphoneRequired,
      microphoneMonitoringEnabled: !!req.body.microphoneMonitoringEnabled,
      facePresenceMonitoringEnabled: !!req.body.facePresenceMonitoringEnabled,
      multipleFaceDetectionEnabled: !!req.body.multipleFaceDetectionEnabled,
      fullscreenRequired: !!req.body.fullscreenRequired,
      maxFullscreenExits: req.body.maxFullscreenExits || 3,
      terminateAfterFullscreenExits: !!req.body.terminateAfterFullscreenExits,
      proctoringConfig: req.body.proctoringConfig || {
        lowRiskThreshold: 15,
        mediumRiskThreshold: 40,
        highRiskThreshold: 60,
        maxTabSwitches: 5,
        autoFlagOnHighRisk: true,
        autoTerminateOnHighRisk: false,
      },
      createdBy: req.user._id,
    });

    await logAdminAction({
      action: 'EXAM_CREATED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      details: { title: exam.title, questionsCount: exam.questions.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      data: exam,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update exam (Admin)
// @route   PUT /api/exams/:id
const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Recalculate total marks if questions updated
    if (req.body.questions) {
      const questionDocs = await Question.find({ _id: { $in: req.body.questions } });
      req.body.totalMarks = questionDocs.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAdminAction({
      action: 'EXAM_UPDATED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: updatedExam._id,
      details: { title: updatedExam.title },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully.',
      data: updatedExam,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle publish status (Admin)
// @route   PATCH /api/exams/:id/publish
const togglePublish = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    const newStatus = exam.status === 'LIVE' ? 'DRAFT' : 'LIVE';
    exam.status = newStatus;
    await exam.save();

    await logAdminAction({
      action: newStatus === 'LIVE' ? 'EXAM_PUBLISHED' : 'EXAM_ARCHIVED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      details: { newStatus },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Exam status changed to ${newStatus}.`,
      data: exam,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Archive exam (Admin)
// @route   DELETE /api/exams/:id
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    exam.status = 'ARCHIVED';
    await exam.save();

    await logAdminAction({
      action: 'EXAM_DELETED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Exam archived successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  togglePublish,
  deleteExam,
};
