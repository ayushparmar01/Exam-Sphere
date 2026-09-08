const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
} = require('../controllers/userController');
const { verifyJWT } = require('../middleware/authMiddleware');

router.use(verifyJWT);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/settings', updateSettings);

module.exports = router;
