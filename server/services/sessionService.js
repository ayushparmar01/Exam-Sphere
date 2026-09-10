const crypto = require('crypto');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const Question = require('../models/Question');

/**
 * Fisher-Yates shuffle
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Get active session or create a new one with frozen snapshots
 */
const startOrResumeSession = async ({ studentId, examId, ipAddress = '', userAgent = '' }) => {
  // 1. Check if an active session already exists for this student & exam
  let existingSession = await ExamSession.findOne({
    studentId,
    examId,
    status: 'ACTIVE',
  }).populate('attemptId');

  if (existingSession) {
    const now = new Date();
    // Check if expired
    if (now > existingSession.expiresAt) {
      existingSession.status = 'EXPIRED';
      await existingSession.save();
      if (existingSession.attemptId && existingSession.attemptId.status === 'IN_PROGRESS') {
        existingSession.attemptId.status = 'TIMED_OUT';
        await existingSession.attemptId.save();
      }
    } else {
      // Session is still active! Update heartbeat and return
      existingSession.lastHeartbeat = now;
      await existingSession.save();

      return {
        session: existingSession,
        attempt: existingSession.attemptId,
        isResumed: true,
        remainingSeconds: existingSession.getRemainingSeconds(),
      };
    }
  }

  // 2. No active session found. Check exam validity and attempt rules
  const exam = await Exam.findById(examId).populate('questions');
  if (!exam) {
    throw new Error('Exam not found');
  }

  const computedStatus = exam.getComputedStatus();
  if (computedStatus !== 'LIVE') {
    throw new Error(`Exam is not currently live. Status: ${computedStatus}`);
  }

  // Count past attempts
  const pastAttemptsCount = await ExamAttempt.countDocuments({
    studentId,
    examId,
    status: { $in: ['SUBMITTED', 'TIMED_OUT'] },
  });

  if (pastAttemptsCount >= exam.maximumAttempts) {
    throw new Error(`Maximum attempts limit reached (${exam.maximumAttempts}). No retakes remaining.`);
  }

  if (pastAttemptsCount > 0 && !exam.allowRetake) {
    throw new Error('This exam does not allow retakes.');
  }

  if (!exam.questions || exam.questions.length === 0) {
    throw new Error('This exam currently has no questions assigned.');
  }

  // 3. Freeze immutable question snapshots from exam snapshot or questions collection
  let rawQuestions = [];
  if (exam.snapshot && Array.isArray(exam.snapshot.questions) && exam.snapshot.questions.length > 0) {
    rawQuestions = exam.snapshot.questions;
  } else if (exam.questions && exam.questions.length > 0) {
    rawQuestions = exam.questions.filter((q) => q && q.status !== 'Archived');
  }

  if (rawQuestions.length === 0) {
    throw new Error('No active questions found for this exam.');
  }

  let questionsToUse = [...rawQuestions];
  if (exam.randomizeQuestions) {
    questionsToUse = shuffleArray(questionsToUse);
  }

  const questionSnapshots = [];
  const questionOrder = [];
  const optionOrder = new Map();
  const initialAnswers = [];

  for (const q of questionsToUse) {
    const qIdStr = (q._id || q.questionId).toString();
    questionOrder.push(qIdStr);

    let options = Array.isArray(q.options) ? [...q.options] : [];
    if (exam.randomizeOptions && options.length > 1) {
      options = shuffleArray(options);
    }
    const optIds = options.map((o) => o.id);
    optionOrder.set(qIdStr, optIds);

    questionSnapshots.push({
      questionId: qIdStr,
      version: q.version || 1,
      questionText: q.questionText,
      questionType: q.questionType || 'SINGLE_MCQ',
      options: options.map((o) => ({ id: o.id, text: o.text })),
      correctAnswer: q.correctAnswer || '',
      correctAnswers: q.correctAnswers || [],
      acceptedAnswers: q.acceptedAnswers || [],
      numericalAnswer: typeof q.numericalAnswer === 'number' ? q.numericalAnswer : null,
      numericalTolerance: q.numericalTolerance || 0,
      explanation: q.explanation || '',
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic || '',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      negativeMarks: exam.negativeMarking ? (exam.negativeMarkPenalty || 0.25) : 0,
    });

    initialAnswers.push({
      questionId: qIdStr,
      selectedOption: null,
      selectedOptions: [],
      numericalValue: null,
      textAnswer: null,
      visited: false,
      markedForReview: false,
      savedAt: new Date(),
    });
  }

  // Mark first question as visited
  if (initialAnswers.length > 0) {
    initialAnswers[0].visited = true;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + exam.duration * 60 * 1000);

  // 4. Create ExamAttempt
  const attempt = new ExamAttempt({
    studentId,
    examId,
    attemptNumber: pastAttemptsCount + 1,
    startedAt: now,
    expiresAt,
    status: 'IN_PROGRESS',
    submissionId: crypto.randomUUID(),
    questionSnapshots,
    questionOrder,
    optionOrder,
    answers: initialAnswers,
    currentQuestionIndex: 0,
    timeSpentSeconds: 0,
  });
  await attempt.save();

  // 5. Create ExamSession
  const sessionId = crypto.randomUUID();
  const session = new ExamSession({
    sessionId,
    attemptId: attempt._id,
    studentId,
    examId,
    startedAt: now,
    expiresAt,
    lastHeartbeat: now,
    status: 'ACTIVE',
    ipAddress,
    userAgent,
  });
  await session.save();

  return {
    session,
    attempt,
    isResumed: false,
    remainingSeconds: Math.floor((expiresAt - now) / 1000),
  };
};

module.exports = { startOrResumeSession };
