const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/student', verifyJWT, getStudentAnalytics);
router.get('/admin', verifyJWT, requireRole('ADMIN'), getAdminAnalytics);

module.exports = router;
