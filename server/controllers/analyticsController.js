const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');

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

module.exports = {
  getStudentAnalytics,
  getAdminAnalytics,
};
