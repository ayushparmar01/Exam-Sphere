const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { verifyJWT } = require('../middleware/authMiddleware');

// Optional auth so rankings can highlight current user if logged in
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return verifyJWT(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getLeaderboard);
router.get('/:examId', optionalAuth, getLeaderboard);

module.exports = router;
