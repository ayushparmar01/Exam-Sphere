const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingPercentage: {
      type: Number,
      default: 40,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unattemptedCount: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    subjectPerformance: [
      {
        subject: { type: String, required: true },
        totalQuestions: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        incorrect: { type: Number, default: 0 },
        unattempted: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
    ],
    topicPerformance: [
      {
        topic: { type: String, required: true },
        subject: { type: String, default: '' },
        totalQuestions: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        incorrect: { type: Number, default: 0 },
        unattempted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
    ],
    questionReview: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        options: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
          },
        ],
        selectedOption: { type: String, default: null },
        correctAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
        marksAwarded: { type: Number, default: 0 },
        explanation: { type: String, default: '' },
        subject: { type: String, default: '' },
        topic: { type: String, default: '' },
        difficulty: { type: String, default: 'Medium' },
      },
    ],
    aiAnalysis: {
      mode: { type: String, enum: ['GEMINI', 'RULE_BASED'], default: 'RULE_BASED' },
      summary: { type: String, default: '' },
      strengths: [{ type: String }],
      weakAreas: [{ type: String }],
      studyPlan: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ examId: 1, score: -1, accuracy: -1, timeTakenSeconds: 1 });
resultSchema.index({ studentId: 1, createdAt: -1 });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
