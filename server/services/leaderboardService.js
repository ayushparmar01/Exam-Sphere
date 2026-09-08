const Result = require('../models/Result');
const User = require('../models/User');

/**
 * Deterministic tie-breaker sort for leaderboard entries:
 * 1. Higher score
 * 2. Higher accuracy
 * 3. Lower time taken
 */
const sortLeaderboardEntries = (a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.accuracy !== a.accuracy) {
    return b.accuracy - a.accuracy;
  }
  return a.timeTakenSeconds - b.timeTakenSeconds;
};

/**
 * Calculate dynamic percentile:
 * (number of participants who scored strictly lower / total participants) * 100
 */
const calculatePercentile = (targetScore, allScores) => {
  if (!allScores || allScores.length <= 1) return 100;
  const lowerCount = allScores.filter((s) => s < targetScore).length;
  return Math.round((lowerCount / allScores.length) * 100 * 10) / 10;
};

/**
 * Get Exam-Specific Leaderboard
 * Aggregates by student and selects their BEST valid attempt.
 */
const getExamLeaderboard = async (examId, currentUserId = null) => {
  const results = await Result.find({ examId })
    .populate('studentId', 'name email avatar')
    .lean();

  if (!results || results.length === 0) {
    return { leaderboard: [], totalParticipants: 0, currentUserRank: null };
  }

  // Group by studentId and pick best valid attempt
  const bestAttemptMap = new Map();

  for (const res of results) {
    if (!res.studentId) continue;
    const studentIdStr = res.studentId._id.toString();

    if (!bestAttemptMap.has(studentIdStr)) {
      bestAttemptMap.set(studentIdStr, res);
    } else {
      const existingBest = bestAttemptMap.get(studentIdStr);
      // Compare existing vs new
      const comparison = sortLeaderboardEntries(res, existingBest);
      if (comparison < 0) {
        // res is better than existingBest
        bestAttemptMap.set(studentIdStr, res);
      }
    }
  }

  const entries = Array.from(bestAttemptMap.values());
  entries.sort(sortLeaderboardEntries);

  const allScores = entries.map((e) => e.score);
  const totalParticipants = entries.length;

  let currentUserRank = null;

  const leaderboard = entries.map((entry, index) => {
    const rank = index + 1;
    const percentile = calculatePercentile(entry.score, allScores);
    const isCurrent = currentUserId && entry.studentId._id.toString() === currentUserId.toString();

    if (isCurrent) {
      currentUserRank = {
        rank,
        percentile,
        score: entry.score,
        accuracy: entry.accuracy,
        timeTakenSeconds: entry.timeTakenSeconds,
      };
    }

    return {
      rank,
      percentile,
      student: {
        id: entry.studentId._id,
        name: entry.studentId.name,
        email: entry.studentId.email,
        avatar: entry.studentId.avatar,
      },
      score: entry.score,
      totalMarks: entry.totalMarks,
      percentage: entry.percentage,
      accuracy: entry.accuracy,
      timeTakenSeconds: entry.timeTakenSeconds,
      isPassed: entry.isPassed,
      attemptId: entry.attemptId,
      submittedAt: entry.createdAt,
      isCurrentUser: isCurrent,
    };
  });

  return { leaderboard, totalParticipants, currentUserRank };
};

/**
 * Get Global Leaderboard across all exams
 */
const getGlobalLeaderboard = async (currentUserId = null) => {
  // Aggregate students with their completed tests, average score, and best score
  const users = await User.find({ role: 'STUDENT' })
    .select('name email avatar stats')
    .lean();

  const userEntries = users
    .filter((u) => (u.stats && u.stats.testsCompleted > 0) || (u.stats && u.stats.testsTaken > 0))
    .map((u) => {
      const stats = u.stats || {};
      return {
        student: {
          id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
        },
        testsCompleted: stats.testsCompleted || 0,
        averageScore: stats.averageScore || 0,
        accuracy: stats.accuracy || 0,
        bestScore: stats.bestScore || 0,
      };
    });

  // Sort by averageScore DESC, accuracy DESC, testsCompleted DESC
  userEntries.sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.testsCompleted - a.testsCompleted;
  });

  let currentUserRank = null;
  const leaderboard = userEntries.map((entry, index) => {
    const rank = index + 1;
    const isCurrent = currentUserId && entry.student.id.toString() === currentUserId.toString();
    if (isCurrent) {
      currentUserRank = { rank, ...entry };
    }
    return {
      rank,
      ...entry,
      isCurrentUser: isCurrent,
    };
  });

  return { leaderboard, totalParticipants: leaderboard.length, currentUserRank };
};

module.exports = {
  getExamLeaderboard,
  getGlobalLeaderboard,
  calculatePercentile,
  sortLeaderboardEntries,
};
