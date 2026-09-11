const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const { getIO } = require('../config/socket');

router.use(verifyJWT);

/**
 * GET /api/announcements
 * Retrieve announcements targeting the logged-in user
 */
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'STUDENT') {
      query = {
        $or: [
          { targetScope: 'COLLEGE' },
          { targetScope: 'DEPARTMENT', department: user.department?.toUpperCase() },
          {
            targetScope: 'YEAR',
            department: user.department?.toUpperCase(),
            year: user.year,
          },
          {
            targetScope: 'SECTION',
            department: user.department?.toUpperCase(),
            year: user.year,
            sections: user.section?.toUpperCase(),
          },
        ],
      };
    } else if (user.role === 'TEACHER') {
      query = {
        $or: [
          { authorId: user._id },
          { targetScope: 'COLLEGE' },
          { targetScope: 'DEPARTMENT', department: user.department?.toUpperCase() },
        ],
      };
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/announcements
 * Create an announcement and broadcast via Socket.IO and Notification records
 */
router.post('/', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { title, content, category, priority, targetScope, department, year, sections } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'GENERAL',
      priority: priority || 'MEDIUM',
      targetScope: targetScope || 'SECTION',
      department: department ? department.toUpperCase() : '',
      year: year ? Number(year) : null,
      sections: Array.isArray(sections) ? sections.map((s) => s.toUpperCase()) : [],
      authorId: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
    });

    // Real-time broadcast via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.emit('new_announcement', {
          id: announcement._id,
          title: announcement.title,
          category: announcement.category,
          priority: announcement.priority,
          authorName: announcement.authorName,
          targetScope: announcement.targetScope,
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Announcement broadcast skipped:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Announcement posted and broadcast successfully',
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
