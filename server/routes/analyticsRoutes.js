const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getAdminAnalytics, getTeacherAnalytics } = require('../controllers/analyticsController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/student', verifyJWT, getStudentAnalytics);
router.get('/teacher', verifyJWT, requireRole('TEACHER', 'ADMIN'), getTeacherAnalytics);
router.get('/admin', verifyJWT, requireRole('ADMIN'), getAdminAnalytics);

module.exports = router;
