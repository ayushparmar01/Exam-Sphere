const express = require('express');
const router = express.Router();
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  togglePublish,
  deleteExam,
} = require('../controllers/examController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Optional auth for browsing exams (allows personalized attempt status if logged in)
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return verifyJWT(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getExams);
router.get('/:id', optionalAuth, getExamById);

// Admin & Teacher management routes
router.post('/', verifyJWT, requireRole('ADMIN', 'TEACHER'), createExam);
router.put('/:id', verifyJWT, requireRole('ADMIN', 'TEACHER'), updateExam);
router.patch('/:id/publish', verifyJWT, requireRole('ADMIN', 'TEACHER'), togglePublish);
router.delete('/:id', verifyJWT, requireRole('ADMIN', 'TEACHER'), deleteExam);

module.exports = router;
