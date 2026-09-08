const { getExamLeaderboard, getGlobalLeaderboard } = require('../services/leaderboardService');
const Exam = require('../models/Exam');

// @desc    Get leaderboard (Global or Exam-specific)
// @route   GET /api/leaderboard or GET /api/leaderboard/:examId
const getLeaderboard = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    if (examId && examId !== 'global') {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found.' });
      }

      // Check if exam allows leaderboard
      if (!exam.showLeaderboard && req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Leaderboard is private for this examination.',
        });
      }

      const data = await getExamLeaderboard(examId, currentUserId);
      return res.status(200).json({
        success: true,
        type: 'EXAM',
        exam: { id: exam._id, title: exam.title, subject: exam.subject },
        ...data,
      });
    }

    // Global leaderboard
    const data = await getGlobalLeaderboard(currentUserId);
    res.status(200).json({
      success: true,
      type: 'GLOBAL',
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
