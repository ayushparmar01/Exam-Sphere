const express = require('express');
const router = express.Router();
const {
  getResultByAttemptId,
  getMyResults,
  downloadResultPDF,
} = require('../controllers/resultController');
const { verifyJWT } = require('../middleware/authMiddleware');

router.use(verifyJWT);

router.get('/my-results', getMyResults);
router.get('/:attemptId', getResultByAttemptId);
router.get('/:attemptId/pdf', downloadResultPDF);

module.exports = router;
