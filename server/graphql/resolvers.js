const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const ExamIntegrityEvent = require('../models/ExamIntegrityEvent');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudyMaterial = require('../models/StudyMaterial');
const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const academicService = require('../services/academicService');
const { getLeaderboard } = require('../services/leaderboardService');

const requireAuth = (context) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
};

const requireAdmin = (context) => {
  requireAuth(context);
  if (context.user.role !== 'ADMIN') {
    throw new Error('Admin authorization required');
  }
};

const rootResolver = {
  // Current user
  async me(args, context) {
    if (!context.user) return null;
    const user = await User.findById(context.user._id).select('-passwordHash');
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      stats: user.stats,
    };
  },

  // Student Dashboard Analytics
  async dashboardAnalytics({ studentId }, context) {
    requireAuth(context);
    const targetStudentId = context.user.role === 'ADMIN' && studentId ? studentId : context.user._id;

    const user = await User.findById(targetStudentId);
    if (!user) throw new Error('Student not found');

    const recentResults = await Result.find({ studentId: targetStudentId })
      .populate('examId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const upcomingExamsCount = await Exam.countDocuments({
      status: 'SCHEDULED',
      startTime: { $gt: new Date() },
    });

    return {
      stats: user.stats || { testsCompleted: 0, averageScore: 0, accuracy: 0, bestScore: 0 },
      recentResults: recentResults.map((r) => ({
        id: r._id.toString(),
        examTitle: r.examId?.title || 'Examination',
        score: r.score,
        totalMarks: r.totalMarks,
        percentage: r.percentage,
        isPassed: r.isPassed,
        createdAt: r.createdAt.toISOString(),
      })),
      upcomingExamsCount,
    };
  },

  // Exam Analytics
  async examAnalytics({ examId }, context) {
    requireAuth(context);
    const exam = await Exam.findById(examId);
    if (!exam) throw new Error('Exam not found');

    const results = await Result.find({ examId });
    const totalAttempts = results.length;

    let averageScore = 0;
    let passCount = 0;
    let highestScore = 0;
    let lowestScore = 0;

    if (totalAttempts > 0) {
      const scores = results.map((r) => r.score);
      averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalAttempts) * 10) / 10;
      passCount = results.filter((r) => r.isPassed).length;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    return {
      examId: exam._id.toString(),
      title: exam.title,
      totalAttempts,
      averageScore,
      passPercentage: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100 * 10) / 10 : 0,
      highestScore,
      lowestScore,
    };
  },

  // Admin Live Overview
  async adminLiveOverview({ examId }, context) {
    requireAdmin(context);

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

    return {
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
    };
  },

  // Candidate Monitoring List
  async candidateMonitoringList({ examId, riskLevel, status }, context) {
    requireAdmin(context);

    const filter = {};
    if (examId) filter.examId = examId;
    if (riskLevel) filter.integrityRiskLevel = riskLevel;
    if (status) filter.status = status;

    const attempts = await ExamAttempt.find(filter)
      .populate('studentId', 'name email')
      .populate('examId', 'title duration')
      .sort({ updatedAt: -1 })
      .limit(100);

    const now = Date.now();

    return attempts.map((att) => {
      const remainingSeconds = Math.max(0, Math.floor((new Date(att.expiresAt).getTime() - now) / 1000));
      const answeredCount = att.answers ? att.answers.filter((a) => a.selectedOption !== null).length : 0;
      const totalQuestions = att.questionSnapshots ? att.questionSnapshots.length : 0;

      return {
        attemptId: att._id.toString(),
        studentId: att.studentId?._id?.toString() || 'unknown',
        studentName: att.studentId?.name || 'Anonymous Student',
        studentEmail: att.studentId?.email || 'N/A',
        examId: att.examId?._id?.toString() || 'unknown',
        examTitle: att.examId?.title || 'Exam',
        status: att.status,
        remainingSeconds: att.status === 'IN_PROGRESS' ? remainingSeconds : 0,
        currentQuestionIndex: att.currentQuestionIndex || 0,
        totalQuestions,
        answeredCount,
        integrityRiskScore: att.integrityRiskScore || 0,
        integrityRiskLevel: att.integrityRiskLevel || 'LOW',
        integrityEventCount: att.integrityEventCount || 0,
        isFlaggedForReview: !!att.isFlaggedForReview,
        cameraStatus: att.cameraStatus || 'NOT_REQUIRED',
        microphoneStatus: att.microphoneStatus || 'NOT_REQUIRED',
        connectionStatus: att.connectionStatus || 'CONNECTED',
        lastHeartbeat: att.lastHeartbeat ? att.lastHeartbeat.toISOString() : att.updatedAt.toISOString(),
      };
    });
  },

  // Candidate Integrity Detail
  async candidateIntegrityDetail({ attemptId }, context) {
    requireAdmin(context);

    const attempt = await ExamAttempt.findById(attemptId)
      .populate('studentId', 'name email')
      .populate('examId', 'title');

    if (!attempt) throw new Error('Attempt not found');

    const events = await ExamIntegrityEvent.find({ attemptId }).sort({ timestamp: 1 });

    return {
      attemptId: attempt._id.toString(),
      studentName: attempt.studentId?.name || 'Student',
      studentEmail: attempt.studentId?.email || 'N/A',
      examTitle: attempt.examId?.title || 'Exam',
      status: attempt.status,
      integrityRiskScore: attempt.integrityRiskScore || 0,
      integrityRiskLevel: attempt.integrityRiskLevel || 'LOW',
      isFlaggedForReview: !!attempt.isFlaggedForReview,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
      events: events.map((e) => ({
        id: e._id.toString(),
        eventType: e.eventType,
        severity: e.severity || 'LOW',
        riskPoints: e.riskPoints || 0,
        timestamp: e.timestamp.toISOString(),
        metadata: e.metadata ? JSON.stringify(e.metadata) : null,
      })),
    };
  },

  // Leaderboard
  async leaderboard({ examId, limit = 10 }, context) {
    requireAuth(context);
    const result = await getLeaderboard(examId, { page: 1, limit });
    return (result.leaderboard || []).map((item) => ({
      rank: item.rank,
      studentId: item.studentId.toString(),
      studentName: item.studentName,
      score: item.score,
      accuracy: item.accuracy,
      timeSpentSeconds: item.timeSpentSeconds,
      percentile: item.percentile,
    }));
  },

  // Notifications
  async notifications({ limit = 10 }, context) {
    requireAuth(context);
    const notifications = await Notification.find({ userId: context.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  },

  // Student Academic Space
  async studentAcademicSpace(args, context) {
    requireAuth(context);
    const user = await User.findById(context.user._id).select('-passwordHash');
    if (!user) throw new Error('User not found');

    const now = new Date();
    const scopeFilter = [
      { targetScope: 'COLLEGE' },
      { targetScope: 'DEPARTMENT', targetDepartment: user.department },
      { targetScope: 'YEAR', targetDepartment: user.department, targetYear: user.year },
      { targetScope: 'SECTION', targetDepartment: user.department, targetYear: user.year, targetSections: user.section },
      { targetScope: 'SECTIONS', targetDepartment: user.department, targetYear: user.year, targetSections: user.section },
    ];

    const exams = await Exam.find({
      $or: scopeFilter,
      status: { $in: ['SCHEDULED', 'LIVE', 'PUBLISHED'] },
    }).sort({ startTime: 1 });

    const upcomingExams = exams
      .filter((e) => new Date(e.startTime) > now && e.status === 'SCHEDULED')
      .map((e) => ({
        id: e._id.toString(),
        title: e.title,
        subject: e.subject,
        duration: e.duration,
        totalMarks: e.totalMarks,
        startTime: e.startTime ? e.startTime.toISOString() : null,
        endTime: e.endTime ? e.endTime.toISOString() : null,
        targetScope: e.targetScope,
        status: e.status,
      }));

    const activeExams = exams
      .filter((e) => e.status === 'LIVE' || (new Date(e.startTime) <= now && new Date(e.endTime) >= now))
      .map((e) => ({
        id: e._id.toString(),
        title: e.title,
        subject: e.subject,
        duration: e.duration,
        totalMarks: e.totalMarks,
        startTime: e.startTime ? e.startTime.toISOString() : null,
        endTime: e.endTime ? e.endTime.toISOString() : null,
        targetScope: e.targetScope,
        status: e.status,
      }));

    // Assignments
    const assignments = await Assignment.find({
      $or: [
        { scope: 'COLLEGE' },
        { scope: 'DEPARTMENT', department: user.department },
        { scope: 'YEAR', department: user.department, year: user.year },
        { scope: 'SECTION', department: user.department, year: user.year, section: user.section },
      ],
      status: 'PUBLISHED',
    }).sort({ dueDate: 1 });

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
      studentId: user._id,
    });
    const submittedMap = new Set(submissions.map((s) => s.assignmentId.toString()));

    const pendingAssignments = assignments.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      subject: a.subject,
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      status: a.status,
      isSubmitted: submittedMap.has(a._id.toString()),
    }));

    // Diagnostic topic performance
    const results = await Result.find({ studentId: user._id }).sort({ createdAt: -1 }).limit(10);
    const topicMap = {};
    results.forEach((r) => {
      if (r.topicPerformance && Array.isArray(r.topicPerformance)) {
        r.topicPerformance.forEach((tp) => {
          if (!topicMap[tp.topic]) {
            topicMap[tp.topic] = { topic: tp.topic, subject: tp.subject, total: 0, correct: 0 };
          }
          topicMap[tp.topic].total += tp.totalQuestions || 1;
          topicMap[tp.topic].correct += tp.correct || 0;
        });
      }
    });

    const needsRevisionTopics = Object.values(topicMap)
      .map((t) => ({
        topic: t.topic,
        subject: t.subject || 'General',
        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
        attempts: t.total,
      }))
      .filter((t) => t.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const studyMaterialsCount = await StudyMaterial.countDocuments({
      status: 'ACTIVE',
      $or: [
        { department: user.department, year: user.year },
        { department: 'ALL' },
      ],
    });

    return {
      student: {
        id: user._id.toString(),
        name: user.name,
        rollNumber: user.rollNumber || 'N/A',
        department: user.department || 'CSE',
        program: user.program || 'B.Tech',
        year: user.year || 1,
        section: user.section || 'A',
      },
      upcomingExams,
      activeExams,
      pendingAssignments,
      needsRevisionTopics,
      studyMaterialsCount,
    };
  },

  // Teacher Academic Dashboard
  async teacherAcademicDashboard(args, context) {
    requireAuth(context);
    if (!['TEACHER', 'ADMIN'].includes(context.user.role)) {
      throw new Error('Teacher or Admin authorization required');
    }

    const assignedSections = await TeacherSectionAssignment.find({
      teacherId: context.user._id,
      status: 'ACTIVE',
    });

    const teacherAssignments = await Assignment.find({ createdBy: context.user._id });
    const teacherAssignmentIds = teacherAssignments.map((a) => a._id);

    const pendingSubmissionsCount = await AssignmentSubmission.countDocuments({
      assignmentId: { $in: teacherAssignmentIds },
      status: 'SUBMITTED',
    });

    const activeExamsCount = await Exam.countDocuments({
      createdBy: context.user._id,
      status: { $in: ['SCHEDULED', 'LIVE'] },
    });

    let totalStudents = 0;
    if (assignedSections.length > 0) {
      const orConditions = assignedSections.map((as) => ({
        department: as.departmentCode,
        year: as.year,
        section: as.sectionName,
      }));
      totalStudents = await User.countDocuments({
        role: 'STUDENT',
        $or: orConditions,
      });
    }

    return {
      assignedSections: assignedSections.map((as) => ({
        id: as._id.toString(),
        departmentCode: as.departmentCode,
        year: as.year,
        sectionName: as.sectionName,
        subject: as.subject,
      })),
      totalStudents,
      pendingSubmissionsCount,
      activeExamsCount,
    };
  },

  // Section Analytics
  async sectionAnalytics({ department, year, sectionName }, context) {
    requireAuth(context);
    return await academicService.getSectionAnalytics({ department, year, sectionName });
  },

  // Year Analytics
  async yearAnalytics({ department, year }, context) {
    requireAuth(context);
    return await academicService.getYearAnalytics({ department, year });
  },

  // College Academic Analytics
  async collegeAcademicAnalytics(args, context) {
    requireAdmin(context);
    return await academicService.getCollegeAnalytics();
  },

  // Mutations
  async flagAttempt({ attemptId, reason }, context) {
    requireAdmin(context);
    await ExamAttempt.findByIdAndUpdate(attemptId, {
      $set: { isFlaggedForReview: true },
    });
    return { success: true, message: `Attempt ${attemptId} flagged for review.` };
  },

  async dismissIntegrityNotice({ attemptId }, context) {
    requireAdmin(context);
    await ExamAttempt.findByIdAndUpdate(attemptId, {
      $set: { isFlaggedForReview: false },
    });
    return { success: true, message: `Integrity notice for attempt ${attemptId} cleared.` };
  },
};

module.exports = rootResolver;
