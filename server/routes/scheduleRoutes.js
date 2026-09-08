const express = require('express');
const router = express.Router();
const { getSchedule } = require('../controllers/scheduleController');
const { verifyJWT } = require('../middleware/authMiddleware');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return verifyJWT(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getSchedule);

module.exports = router;
