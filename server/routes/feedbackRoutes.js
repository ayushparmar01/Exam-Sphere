const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Exam = require('../models/Exam');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');

router.use(verifyJWT);

/**
 * POST /api/feedback
 * Submit general or post-exam feedback
 */
router.post('/', async (req, res, next) => {
  try {
    const { category, rating, message, examId, assignmentId, teacherId, isAnonymous, criteriaRatings } = req.body;

    if (!category || !rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Valid category and rating (1-5) are required' });
    }

    let targetTeacherId = teacherId || null;

    // If exam feedback and teacherId not provided, look up exam creator
    if (examId && !targetTeacherId) {
      const exam = await Exam.findById(examId).select('createdBy');
      if (exam && exam.createdBy) {
        targetTeacherId = exam.createdBy;
      }
    }

    const feedback = await Feedback.create({
      category: category.toUpperCase(),
      rating: Number(rating),
      message: message || '',
      examId: examId || null,
      assignmentId: assignmentId || null,
      teacherId: targetTeacherId,
      studentId: req.user._id,
      isAnonymous: Boolean(isAnonymous),
      criteriaRatings: criteriaRatings || {},
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping improve the platform.',
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback
 * Teachers view feedback relevant to them; Admins view all/aggregate
 */
router.get('/', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { category, examId } = req.query;
    const query = {};

    if (req.user.role === 'TEACHER') {
      query.teacherId = req.user._id;
    }
    if (category) query.category = category.toUpperCase();
    if (examId) query.examId = examId;

    const list = await Feedback.find(query)
      .populate('examId', 'title subject')
      .populate('studentId', 'name email rollNumber department year section')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Sanitize anonymous submissions
    const sanitized = list.map((f) => {
      if (f.isAnonymous) {
        return {
          ...f,
          studentId: null,
          studentName: 'Anonymous Student',
        };
      }
      return {
        ...f,
        studentName: f.studentId?.name || 'Identified Student',
      };
    });

    // Compute average ratings
    const total = sanitized.length;
    const avgRating = total > 0
      ? Math.round((sanitized.reduce((acc, f) => acc + (f.rating || 0), 0) / total) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      count: total,
      averageRating: avgRating,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
