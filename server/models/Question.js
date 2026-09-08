const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: [
      {
        id: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'D'
        text: { type: String, required: true },
      },
    ],
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
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
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ subject: 1, topic: 1, difficulty: 1, status: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
