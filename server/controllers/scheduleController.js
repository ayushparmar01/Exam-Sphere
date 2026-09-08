const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');

// @desc    Get assessment schedule timeline
// @route   GET /api/schedule
const getSchedule = async (req, res, next) => {
  try {
    const now = new Date();

    const exams = await Exam.find({
      status: { $in: ['LIVE', 'SCHEDULED'] },
    }).sort({ startTime: 1 });

    let studentAttempts = [];
    if (req.user && req.user.role === 'STUDENT') {
      studentAttempts = await ExamAttempt.find({
        studentId: req.user._id,
      }).select('examId status');
    }

    const completedExamIds = new Set(
      studentAttempts
        .filter((a) => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT')
        .map((a) => a.examId.toString())
    );

    const activeAttemptExamIds = new Set(
      studentAttempts
        .filter((a) => a.status === 'IN_PROGRESS')
        .map((a) => a.examId.toString())
    );

    const events = exams.map((e) => {
      const examIdStr = e._id.toString();
      let scheduleStatus = 'UPCOMING';

      if (completedExamIds.has(examIdStr)) {
        scheduleStatus = 'COMPLETED';
      } else if (activeAttemptExamIds.has(examIdStr)) {
        scheduleStatus = 'IN_PROGRESS';
      } else if (e.startTime <= now && (!e.endTime || e.endTime >= now)) {
        scheduleStatus = 'LIVE';
      } else if (e.endTime && e.endTime < now) {
        scheduleStatus = 'EXPIRED';
      }

      return {
        id: e._id,
        title: e.title,
        subject: e.subject,
        difficulty: e.difficulty,
        duration: e.duration,
        startTime: e.startTime,
        endTime: e.endTime,
        scheduleStatus,
        totalMarks: e.totalMarks,
        questionsCount: e.questions ? e.questions.length : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSchedule };
