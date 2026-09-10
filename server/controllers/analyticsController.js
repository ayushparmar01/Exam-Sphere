const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Question = require('../models/Question');

// @desc    Get comprehensive student analytics
// @route   GET /api/analytics/student
const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const results = await Result.find({ studentId })
      .populate('examId', 'title subject')
      .sort({ createdAt: 1 });

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        hasData: false,
        summary: {
          testsTaken: 0,
          averageScore: 0,
          accuracy: 0,
          bestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
        },
        scoreTrend: [],
        subjectPerformance: [],
        weakAreas: [],
        strongAreas: [],
        difficultyPerformance: [],
        mistakeAnalysis: [],
      });
    }

    // 1. Score Trend (Test 1 -> 65%, Test 2 -> 72%, ...)
    const scoreTrend = results.map((r, idx) => ({
      testNumber: `Test ${idx + 1}`,
      examTitle: r.examId ? r.examId.title : `Exam ${idx + 1}`,
      percentage: r.percentage,
      accuracy: r.accuracy,
      date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    // 2. Aggregate Subject and Topic Performance
    const subjectMap = {};
    const topicMap = {};
    const difficultyMap = {
      Easy: { correct: 0, attempted: 0, total: 0 },
      Medium: { correct: 0, attempted: 0, total: 0 },
      Hard: { correct: 0, attempted: 0, total: 0 },
    };

    const mistakeList = [];

    results.forEach((r) => {
      // Subject aggregation
      (r.subjectPerformance || []).forEach((s) => {
        if (!subjectMap[s.subject]) {
          subjectMap[s.subject] = { subject: s.subject, total: 0, correct: 0, incorrect: 0 };
        }
        subjectMap[s.subject].total += s.totalQuestions;
        subjectMap[s.subject].correct += s.correct;
        subjectMap[s.subject].incorrect += s.incorrect;
      });

      // Topic aggregation
      (r.topicPerformance || []).forEach((t) => {
        if (!topicMap[t.topic]) {
          topicMap[t.topic] = { topic: t.topic, subject: t.subject, total: 0, correct: 0, incorrect: 0 };
        }
        topicMap[t.topic].total += t.totalQuestions;
        topicMap[t.topic].correct += t.correct;
        topicMap[t.topic].incorrect += t.incorrect;
      });

      // Question review difficulty & mistakes
      (r.questionReview || []).forEach((q) => {
        const diff = q.difficulty || 'Medium';
        if (difficultyMap[diff]) {
          difficultyMap[diff].total++;
          if (q.selectedOption) difficultyMap[diff].attempted++;
          if (q.isCorrect) difficultyMap[diff].correct++;
        }

        if (!q.isCorrect && q.selectedOption) {
          mistakeList.push({
            resultId: r._id,
            examTitle: r.examId ? r.examId.title : 'Assessment',
            questionText: q.questionText,
            selectedOption: q.selectedOption,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty,
            date: r.createdAt,
          });
        }
      });
    });

    const subjectPerformance = Object.values(subjectMap).map((s) => ({
      subject: s.subject,
      accuracy: s.correct + s.incorrect > 0 ? Math.round((s.correct / (s.correct + s.incorrect)) * 100) : 0,
      totalQuestions: s.total,
    }));

    const topicList = Object.values(topicMap).map((t) => ({
      topic: t.topic,
      subject: t.subject,
      accuracy: t.correct + t.incorrect > 0 ? Math.round((t.correct / (t.correct + t.incorrect)) * 100) : 0,
      totalQuestions: t.total,
      incorrectCount: t.incorrect,
    }));

    const weakAreas = topicList
      .filter((t) => t.accuracy < 65)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6);

    const strongAreas = topicList
      .filter((t) => t.accuracy >= 75)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 6);

    const difficultyPerformance = Object.keys(difficultyMap).map((diff) => {
      const data = difficultyMap[diff];
      return {
        difficulty: diff,
        accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
        total: data.total,
      };
    });

    // Summary KPIs
    const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
    const totalIncorrect = results.reduce((sum, r) => sum + r.incorrectCount, 0);
    const totalUnattempted = results.reduce((sum, r) => sum + r.unattemptedCount, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const avgScore = Math.round((results.reduce((sum, r) => sum + r.percentage, 0) / results.length) * 10) / 10;
    const accuracy = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100 * 10) / 10 : 0;
    const bestScore = Math.max(...results.map((r) => r.percentage));

    res.status(200).json({
      success: true,
      hasData: true,
      summary: {
        testsTaken: results.length,
        averageScore: avgScore,
        accuracy,
        bestScore,
        totalCorrect,
        totalIncorrect,
        totalUnattempted,
        totalQuestions,
      },
      scoreTrend,
      subjectPerformance,
      weakAreas,
      strongAreas,
      difficultyPerformance,
      mistakeAnalysis: mistakeList.slice(0, 20), // Return recent mistakes for review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Admin platform analytics
// @route   GET /api/analytics/admin
const getAdminAnalytics = async (req, res, next) => {
  try {
    const [totalStudents, totalExams, activeExams, totalAttempts, allResults] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      Exam.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Exam.countDocuments({ status: 'LIVE' }),
      ExamAttempt.countDocuments(),
      Result.find().select('score percentage accuracy isPassed createdAt'),
    ]);

    const completedAttempts = allResults.length;
    const avgScore = completedAttempts > 0 ? Math.round((allResults.reduce((sum, r) => sum + r.percentage, 0) / completedAttempts) * 10) / 10 : 0;
    const avgAccuracy = completedAttempts > 0 ? Math.round((allResults.reduce((sum, r) => sum + r.accuracy, 0) / completedAttempts) * 10) / 10 : 0;
    const passedCount = allResults.filter((r) => r.isPassed).length;
    const passRate = completedAttempts > 0 ? Math.round((passedCount / completedAttempts) * 100) : 0;

    // Pass / Fail distribution
    const passFailDistribution = [
      { name: 'Passed', value: passedCount, color: '#10b981' },
      { name: 'Failed', value: completedAttempts - passedCount, color: '#ef4444' },
    ];

    // Recent attempts with user & exam info
    const recentAttempts = await ExamAttempt.find()
      .populate('studentId', 'name email avatar')
      .populate('examId', 'title subject duration')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalExams,
          activeExams,
          completedAttempts,
          totalAttempts,
          avgScore,
          avgAccuracy,
          passRate,
        },
        passFailDistribution,
        recentAttempts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comprehensive teacher analytics
// @route   GET /api/analytics/teacher
const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // Find exams created by this teacher (or all if admin)
    const examFilter = req.user.role === 'ADMIN' ? {} : { createdBy: teacherId };
    const teacherExams = await Exam.find(examFilter).select('_id title subject status totalMarks questions');
    const examIds = teacherExams.map((e) => e._id);

    const [totalQuestions, attempts, results] = await Promise.all([
      Question.countDocuments({ createdBy: teacherId, status: { $ne: 'Archived' } }),
      ExamAttempt.find({ examId: { $in: examIds } }).select('status startedAt submittedAt integrityRiskLevel'),
      Result.find({ examId: { $in: examIds } })
        .populate('examId', 'title subject')
        .populate('studentId', 'name email avatar')
        .sort({ createdAt: -1 }),
    ]);

    const totalExams = teacherExams.length;
    const publishedExams = teacherExams.filter((e) => ['LIVE', 'PUBLISHED', 'SCHEDULED'].includes(e.status)).length;
    const liveExams = teacherExams.filter((e) => e.status === 'LIVE').length;
    const totalAttempts = attempts.length;
    const completedAttempts = results.length;

    const avgScore = completedAttempts > 0
      ? Math.round((results.reduce((sum, r) => sum + (r.percentage || 0), 0) / completedAttempts) * 10) / 10
      : 0;
    const avgAccuracy = completedAttempts > 0
      ? Math.round((results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / completedAttempts) * 10) / 10
      : 0;
    const passedCount = results.filter((r) => r.isPassed).length;
    const passRate = completedAttempts > 0 ? Math.round((passedCount / completedAttempts) * 100) : 0;
    const completionRate = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

    // Score distribution brackets: [0-20, 21-40, 41-60, 61-80, 81-100]
    const scoreDistribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    results.forEach((r) => {
      const p = r.percentage || 0;
      if (p <= 20) scoreDistribution[0].count++;
      else if (p <= 40) scoreDistribution[1].count++;
      else if (p <= 60) scoreDistribution[2].count++;
      else if (p <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    // Integrity breakdown
    const integrityBreakdown = {
      lowRisk: attempts.filter((a) => (a.integrityRiskLevel || 'LOW') === 'LOW').length,
      mediumRisk: attempts.filter((a) => a.integrityRiskLevel === 'MEDIUM').length,
      highRisk: attempts.filter((a) => a.integrityRiskLevel === 'HIGH').length,
    };

    // Question analytics aggregated across results
    const questionPerformanceMap = {};
    results.forEach((r) => {
      (r.questionReview || []).forEach((qr) => {
        if (!qr.questionId) return;
        const qid = qr.questionId.toString();
        if (!questionPerformanceMap[qid]) {
          questionPerformanceMap[qid] = {
            questionId: qid,
            questionText: qr.questionText,
            subject: qr.subject,
            topic: qr.topic,
            difficulty: qr.difficulty,
            attempts: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
          };
        }
        questionPerformanceMap[qid].attempts++;
        if (qr.isCorrect) questionPerformanceMap[qid].correct++;
        else if (qr.selectedOption !== null || qr.numericalValue !== null || qr.textAnswer !== null) {
          questionPerformanceMap[qid].incorrect++;
        } else {
          questionPerformanceMap[qid].unattempted++;
        }
      });
    });

    const questionAnalytics = Object.values(questionPerformanceMap).map((q) => {
      const accuracy = q.attempts > 0 ? Math.round((q.correct / q.attempts) * 100) : 0;
      const errorRate = 100 - accuracy;
      return {
        ...q,
        accuracy,
        errorRate,
      };
    });

    // Sort to find most difficult and most skipped
    const mostDifficult = [...questionAnalytics].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
    const mostSkipped = [...questionAnalytics].sort((a, b) => b.unattempted - a.unattempted).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalExams,
          publishedExams,
          liveExams,
          totalQuestions,
          totalAttempts,
          completedAttempts,
          avgScore,
          avgAccuracy,
          passRate,
          completionRate,
        },
        scoreDistribution,
        integrityBreakdown,
        questionAnalytics,
        mostDifficult,
        mostSkipped,
        recentResults: results.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentAnalytics,
  getAdminAnalytics,
  getTeacherAnalytics,
};
