const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['EXAM', 'ASSIGNMENT', 'MATERIAL', 'TEACHER', 'PLATFORM'],
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    // Specific criteria ratings for post-exam feedback
    criteriaRatings: {
      difficulty: { type: Number, min: 1, max: 5 },
      questionQuality: { type: Number, min: 1, max: 5 },
      platformExperience: { type: Number, min: 1, max: 5 },
      technicalStability: { type: Number, min: 1, max: 5 },
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ category: 1, teacherId: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
