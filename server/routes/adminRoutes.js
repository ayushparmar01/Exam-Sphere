const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getAllAttempts,
  getLiveExamMonitoring,
  getAttemptDetails,
  toggleAttemptFlag,
  getRetentionInfo,
  getAuditLogs,
} = require('../controllers/adminController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.use(verifyJWT, requireRole('ADMIN'));

router.get('/students', getAllStudents);
router.get('/attempts', getAllAttempts);
router.get('/monitoring/live', getLiveExamMonitoring);
router.get('/attempts/:id', getAttemptDetails);
router.patch('/attempts/:id/flag', toggleAttemptFlag);
router.get('/retention', getRetentionInfo);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
