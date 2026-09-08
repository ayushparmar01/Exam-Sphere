const express = require('express');
const router = express.Router();
const {
  startOrResumeAttempt,
  getAttemptSession,
  saveAnswer,
  syncBatchAnswers,
  recordIntegrityEvent,
  submitAttempt,
} = require('../controllers/attemptController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { answerLimiter, integrityLimiter } = require('../middleware/rateLimiter');

router.use(verifyJWT);

router.post('/start', startOrResumeAttempt);
router.get('/:id/session', getAttemptSession);
router.put('/:id/answer', answerLimiter, saveAnswer);
router.put('/:id/sync-answers', answerLimiter, syncBatchAnswers);
router.post('/:id/integrity-event', integrityLimiter, recordIntegrityEvent);
router.post('/:id/submit', submitAttempt);

module.exports = router;
