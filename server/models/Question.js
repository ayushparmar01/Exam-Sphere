const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['SINGLE_MCQ', 'MULTIPLE_MCQ', 'TRUE_FALSE', 'NUMERICAL', 'FILL_BLANK'],
      default: 'SINGLE_MCQ',
      index: true,
    },
    options: [
      {
        id: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'D' or 'T', 'F'
        text: { type: String, required: true },
      },
    ],
    // Single MCQ / True-False primary correct answer
    correctAnswer: {
      type: String,
      trim: true,
      default: '',
    },
    // Multiple Correct MCQ answers (e.g. ['A', 'C'])
    correctAnswers: [
      {
        type: String,
        trim: true,
      },
    ],
    // Fill in the Blank accepted matching strings
    acceptedAnswers: [
      {
        type: String,
        trim: true,
      },
    ],
    // Numerical question answer and precision tolerance
    numericalAnswer: {
      type: Number,
      default: null,
    },
    numericalTolerance: {
      type: Number,
      default: 0,
      min: 0,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      index: true,
    },
    subtopic: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      default: 'Unit 1',
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2025-26',
    },
    year: {
      type: Number,
      default: null,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0.5,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [{ type: String, trim: true }],
    estimatedTime: {
      type: Number,
      default: 60, // in seconds
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['Active', 'Pending Review', 'Archived'],
      default: 'Active',
      index: true,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ createdBy: 1, status: 1, subject: 1 });

questionSchema.index({ subject: 1, topic: 1, difficulty: 1, status: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
