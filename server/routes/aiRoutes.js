const express = require('express');
const router = express.Router();
const { generateQuestionsHandler, approveQuestions } = require('../controllers/aiController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.use(verifyJWT, requireRole('ADMIN'));

router.post('/generate-questions', generateQuestionsHandler);
router.patch('/approve-questions', approveQuestions);

module.exports = router;
