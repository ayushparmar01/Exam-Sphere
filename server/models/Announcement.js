const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['EXAM_REMINDER', 'ASSIGNMENT_DEADLINE', 'NOTES_UPLOADED', 'CLASS_NOTICE', 'RESULT_PUBLISHED', 'GENERAL'],
      default: 'GENERAL',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    targetScope: {
      type: String,
      enum: ['COLLEGE', 'DEPARTMENT', 'YEAR', 'SECTION'],
      default: 'SECTION',
    },
    department: {
      type: String,
      uppercase: true,
      default: '',
    },
    year: {
      type: Number,
      default: null,
    },
    sections: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: '',
    },
    authorRole: {
      type: String,
      default: 'TEACHER',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ targetScope: 1, department: 1, year: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
