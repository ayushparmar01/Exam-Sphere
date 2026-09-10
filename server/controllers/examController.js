const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const { paginateQuery } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');

// Helper to construct an immutable exam snapshot from questions and rules
const generateExamSnapshot = async (exam) => {
  const questionDocs = await Question.find({
    _id: { $in: exam.questions },
    status: { $ne: 'Archived' },
  });

  return {
    frozenAt: new Date(),
    questions: questionDocs.map((q) => ({
      questionId: q._id.toString(),
      version: q.version || 1,
      questionText: q.questionText,
      questionType: q.questionType || 'SINGLE_MCQ',
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      correctAnswers: q.correctAnswers || [],
      acceptedAnswers: q.acceptedAnswers || [],
      numericalAnswer: typeof q.numericalAnswer === 'number' ? q.numericalAnswer : null,
      numericalTolerance: q.numericalTolerance || 0,
      explanation: q.explanation || '',
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic || '',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      negativeMarks: exam.negativeMarking ? (exam.negativeMarkPenalty || 0.25) : 0,
    })),
    rules: {
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingPercentage: exam.passingPercentage,
      negativeMarking: exam.negativeMarking,
      negativeMarkPenalty: exam.negativeMarkPenalty,
      maximumAttempts: exam.maximumAttempts,
      allowRetake: exam.allowRetake,
      randomizeQuestions: exam.randomizeQuestions,
      randomizeOptions: exam.randomizeOptions,
      cameraRequired: exam.cameraRequired,
      cameraMonitoringEnabled: exam.cameraMonitoringEnabled,
      microphoneRequired: exam.microphoneRequired,
      microphoneMonitoringEnabled: exam.microphoneMonitoringEnabled,
      fullscreenRequired: exam.fullscreenRequired,
      maxFullscreenExits: exam.maxFullscreenExits,
      showResultImmediately: exam.showResultImmediately,
      showCorrectAnswers: exam.showCorrectAnswers,
      showExplanations: exam.showExplanations,
    },
  };
};

// @desc    Get all exams (for student browse / teacher / admin manage)
// @route   GET /api/exams
const getExams = async (req, res, next) => {
  try {
    const { subject, difficulty, status, search, scope, page = 1, limit = 12 } = req.query;
    const filter = {};

    // Role-based visibility
    if (!req.user || req.user.role === 'STUDENT') {
      filter.status = { $in: ['LIVE', 'SCHEDULED', 'PUBLISHED'] };
    } else if (req.user.role === 'TEACHER') {
      if (scope === 'mine' || !scope) {
        filter.createdBy = req.user._id;
        if (status && status !== 'All') filter.status = status;
      } else {
        if (status && status !== 'All') filter.status = status;
      }
    } else if (status && status !== 'All') {
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
      populate: { path: 'createdBy', select: 'name email role department' },
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
      .populate('createdBy', 'name email role department')
      .populate({
        path: 'questions',
        select: req.user?.role === 'STUDENT'
          ? 'questionText questionType options subject topic subtopic difficulty marks negativeMarks estimatedTime'
          : '',
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    const examObj = exam.toObject();
    examObj.computedStatus = exam.getComputedStatus();

    // Attach student attempt count if authenticated as student
    if (req.user && req.user.role === 'STUDENT') {
      const attempts = await ExamAttempt.find({
        studentId: req.user._id,
        examId: exam._id,
      });
      const completed = attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length;
      examObj.userAttemptsCount = completed;
      examObj.hasActiveSession = attempts.some((a) => a.status === 'IN_PROGRESS');
      examObj.canAttempt = completed < (exam.maximumAttempts || 1) && (completed === 0 || exam.allowRetake);
    }

    res.status(200).json({
      success: true,
      data: examObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create exam (Teacher / Admin)
// @route   POST /api/exams
const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      duration,
      questions = [],
      newQuestions = [],
      negativeMarking,
      negativeMarkPenalty,
      passingPercentage,
      difficulty,
      startTime,
      endTime,
      maximumAttempts,
      allowRetake,
      status,
      questionDistribution,
      distributionConfig,
      showResultImmediately,
      showCorrectAnswers,
      showExplanations,
      showLeaderboard,
      showRank,
      showPercentile,
      randomizeQuestions,
      randomizeOptions,
      cameraRequired,
      cameraMonitoringEnabled,
      microphoneRequired,
      microphoneMonitoringEnabled,
      fullscreenRequired,
      maxFullscreenExits,
      terminateAfterFullscreenExits,
      proctoringConfig,
    } = req.body;

    if (!title || !subject || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, and duration are required.',
      });
    }

    let finalQuestionIds = [...questions];

    // Create inline new questions if provided (Requirement 4)
    if (Array.isArray(newQuestions) && newQuestions.length > 0) {
      const createdInline = await Promise.all(
        newQuestions.map(async (nq) => {
          return await Question.create({
            questionText: nq.questionText,
            questionType: nq.questionType || 'SINGLE_MCQ',
            options: nq.options || [],
            correctAnswer: nq.correctAnswer || '',
            correctAnswers: nq.correctAnswers || [],
            acceptedAnswers: nq.acceptedAnswers || [],
            numericalAnswer: nq.numericalAnswer ?? null,
            numericalTolerance: nq.numericalTolerance || 0,
            explanation: nq.explanation || 'Created with exam.',
            subject: nq.subject || subject,
            topic: nq.topic || 'General',
            subtopic: nq.subtopic || '',
            difficulty: nq.difficulty || difficulty || 'Medium',
            marks: Number(nq.marks) || 1,
            negativeMarks: Number(nq.negativeMarks) || 0,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        })
      );
      finalQuestionIds = [...finalQuestionIds, ...createdInline.map((q) => q._id)];
    }

    // Calculate total marks from questions
    let totalMarks = 0;
    if (finalQuestionIds.length > 0) {
      const questionDocs = await Question.find({ _id: { $in: finalQuestionIds } });
      totalMarks = questionDocs.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    const assignedStatus = status || 'DRAFT';

    const exam = new Exam({
      title: title.trim(),
      description: description ? description.trim() : '',
      subject: subject.trim(),
      duration: Number(duration),
      questions: finalQuestionIds,
      totalMarks,
      negativeMarking: negativeMarking !== false,
      negativeMarkPenalty: negativeMarkPenalty || 0.25,
      passingPercentage: passingPercentage || 40,
      difficulty: difficulty || 'Medium',
      startTime: startTime || new Date(),
      endTime: endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maximumAttempts: maximumAttempts || 1,
      allowRetake: !!allowRetake,
      status: assignedStatus,
      questionDistribution: questionDistribution || 'FIXED',
      distributionConfig: distributionConfig || {},
      showResultImmediately: showResultImmediately !== false,
      showCorrectAnswers: showCorrectAnswers !== false,
      showExplanations: showExplanations !== false,
      showLeaderboard: showLeaderboard !== false,
      showRank: showRank !== false,
      showPercentile: showPercentile !== false,
      randomizeQuestions: randomizeQuestions !== false,
      randomizeOptions: !!randomizeOptions,
      cameraRequired: cameraRequired !== false,
      cameraMonitoringEnabled: cameraMonitoringEnabled !== false,
      microphoneRequired: microphoneRequired !== false,
      microphoneMonitoringEnabled: microphoneMonitoringEnabled !== false,
      fullscreenRequired: fullscreenRequired !== false,
      maxFullscreenExits: maxFullscreenExits || 3,
      terminateAfterFullscreenExits: !!terminateAfterFullscreenExits,
      proctoringConfig: proctoringConfig || {
        lowRiskThreshold: 15,
        mediumRiskThreshold: 40,
        highRiskThreshold: 60,
        maxTabSwitches: 5,
        autoFlagOnHighRisk: true,
        autoTerminateOnHighRisk: false,
      },
      createdBy: req.user._id,
    });

    // If published or live immediately, freeze immutable snapshot
    if (['LIVE', 'PUBLISHED', 'SCHEDULED'].includes(assignedStatus) && finalQuestionIds.length > 0) {
      exam.snapshot = await generateExamSnapshot(exam);
    }

    await exam.save();

    await logAdminAction({
      action: 'EXAM_CREATED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      details: { title: exam.title, questionsCount: exam.questions.length, status: exam.status },
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

// @desc    Update exam (Teacher / Admin)
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

    // Ownership check for TEACHER role
    if (req.user.role === 'TEACHER' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit exams created by yourself.',
      });
    }

    // Support creating new inline questions on update
    if (Array.isArray(req.body.newQuestions) && req.body.newQuestions.length > 0) {
      const createdInline = await Promise.all(
        req.body.newQuestions.map(async (nq) => {
          return await Question.create({
            questionText: nq.questionText,
            questionType: nq.questionType || 'SINGLE_MCQ',
            options: nq.options || [],
            correctAnswer: nq.correctAnswer || '',
            correctAnswers: nq.correctAnswers || [],
            acceptedAnswers: nq.acceptedAnswers || [],
            numericalAnswer: nq.numericalAnswer ?? null,
            numericalTolerance: nq.numericalTolerance || 0,
            explanation: nq.explanation || 'Created with exam.',
            subject: nq.subject || exam.subject,
            topic: nq.topic || 'General',
            subtopic: nq.subtopic || '',
            difficulty: nq.difficulty || exam.difficulty || 'Medium',
            marks: Number(nq.marks) || 1,
            negativeMarks: Number(nq.negativeMarks) || 0,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        })
      );
      req.body.questions = [...(req.body.questions || exam.questions), ...createdInline.map((q) => q._id)];
    }

    // Recalculate total marks if questions updated
    if (req.body.questions) {
      const questionDocs = await Question.find({ _id: { $in: req.body.questions } });
      req.body.totalMarks = questionDocs.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    // Apply updates
    Object.assign(exam, req.body);

    // If transitioned to published or live, freeze/update snapshot
    if (['LIVE', 'PUBLISHED', 'SCHEDULED'].includes(exam.status) && (!exam.snapshot || !exam.snapshot.frozenAt)) {
      exam.snapshot = await generateExamSnapshot(exam);
    }

    await exam.save();

    await logAdminAction({
      action: 'EXAM_UPDATED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      details: { title: exam.title, status: exam.status },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully.',
      data: exam,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle publish status / Snapshot generation (Teacher / Admin)
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

    if (req.user.role === 'TEACHER' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only publish exams created by yourself.',
      });
    }

    const newStatus = exam.status === 'LIVE' || exam.status === 'PUBLISHED' ? 'DRAFT' : 'LIVE';
    exam.status = newStatus;

    if (newStatus === 'LIVE') {
      exam.snapshot = await generateExamSnapshot(exam);
    }

    await exam.save();

    await logAdminAction({
      action: newStatus === 'LIVE' ? 'EXAM_PUBLISHED' : 'EXAM_UNPUBLISHED',
      performedBy: req.user._id,
      entityType: 'EXAM',
      entityId: exam._id,
      details: { newStatus, snapshotCreated: !!exam.snapshot },
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

// @desc    Delete/Archive exam (Teacher / Admin)
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

    if (req.user.role === 'TEACHER' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete exams created by yourself.',
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
