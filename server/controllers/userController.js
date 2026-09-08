const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile & settings
// @route   GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Current password and a new password (min 6 chars) are required.',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
const updateSettings = async (req, res, next) => {
  try {
    const { emailNotifications, examReminders, resultAlerts } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          settings: {
            emailNotifications: !!emailNotifications,
            examReminders: !!examReminders,
            resultAlerts: !!resultAlerts,
          },
        },
      },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: user.settings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
};
