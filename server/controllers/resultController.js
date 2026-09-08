const Result = require('../models/Result');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { getExamLeaderboard } = require('../services/leaderboardService');
const { generateResultPDF } = require('../services/pdfService');
const { paginateQuery } = require('../utils/helpers');

// @desc    Get result by attempt ID
// @route   GET /api/results/:attemptId
const getResultByAttemptId = async (req, res, next) => {
  try {
    const result = await Result.findOne({ attemptId: req.params.attemptId })
      .populate('studentId', 'name email avatar')
      .populate('examId', 'title subject duration passingPercentage showCorrectAnswers showExplanations showLeaderboard showRank showPercentile');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found.',
      });
    }

    // Ensure only the student who took the exam or an admin can access
    if (result.studentId._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this result.',
      });
    }

    // Dynamic rank & percentile calculation
    const leaderboardData = await getExamLeaderboard(result.examId._id, result.studentId._id);
    const currentRank = leaderboardData.currentUserRank || { rank: 1, percentile: 100 };

    const exam = result.examId;
    const resultObj = result.toObject();

    resultObj.rank = exam.showRank ? currentRank.rank : null;
    resultObj.percentile = exam.showPercentile ? currentRank.percentile : null;
    resultObj.totalParticipants = leaderboardData.totalParticipants;

    // Enforce Visibility Policies
    if (!exam.showCorrectAnswers && req.user.role !== 'ADMIN') {
      resultObj.questionReview = resultObj.questionReview.map((q) => ({
        ...q,
        correctAnswer: 'Hidden per examination policy',
      }));
    }

    if (!exam.showExplanations && req.user.role !== 'ADMIN') {
      resultObj.questionReview = resultObj.questionReview.map((q) => ({
        ...q,
        explanation: 'Explanations withheld until evaluation window concludes.',
      }));
    }

    res.status(200).json({
      success: true,
      data: resultObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student's historical results
// @route   GET /api/results/my-results
const getMyResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await paginateQuery(
      Result,
      { studentId: req.user._id },
      {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'examId', select: 'title subject duration totalMarks' },
      }
    );

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

// @desc    Download PDF Performance Report
// @route   GET /api/results/:attemptId/pdf
const downloadResultPDF = async (req, res, next) => {
  try {
    const result = await Result.findOne({ attemptId: req.params.attemptId })
      .populate('studentId', 'name email')
      .populate('examId', 'title subject');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found.',
      });
    }

    if (result.studentId._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const leaderboardData = await getExamLeaderboard(result.examId._id, result.studentId._id);
    const rankInfo = leaderboardData.currentUserRank || { rank: 1, percentile: 100 };

    const pdfBuffer = await generateResultPDF({
      result,
      exam: result.examId,
      user: result.studentId,
      rankInfo,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ExamSphere_Report_${result.attemptId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResultByAttemptId,
  getMyResults,
  downloadResultPDF,
};
