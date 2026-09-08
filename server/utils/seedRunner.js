require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sampleQuestions } = require('./seedData');
const { calculateResultData } = require('../services/scoringService');

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere';
    console.log(`[Seed] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Question.deleteMany({}),
      Exam.deleteMany({}),
      ExamAttempt.deleteMany({}),
      ExamSession.deleteMany({}),
      Result.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const studentPasswordHash = await bcrypt.hash('Student@123', salt);

    const admin = await User.create({
      name: 'ExamSphere Administrator',
      email: 'admin@examsphere.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    // 2. Create Students
    const student = await User.create({
      name: 'Alex Rivera',
      email: 'student@examsphere.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });

    const peers = await User.create([
      {
        name: 'Sarah Chen',
        email: 'sarah@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'David Kim',
        email: 'david@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
    ]);

    console.log(`[Seed] Created 1 Admin and ${peers.length + 1} Students.`);

    // 3. Insert Questions
    const questionsToInsert = sampleQuestions.map((q) => ({
      ...q,
      createdBy: admin._id,
      status: 'Active',
      version: 1,
    }));
    const insertedQuestions = await Question.insertMany(questionsToInsert);
    console.log(`[Seed] Inserted ${insertedQuestions.length} Questions into Question Bank.`);

    // Helper to filter questions by subject
    const getQuestionsForSubject = (subj) => insertedQuestions.filter((q) => q.subject === subj);

    // 4. Create Exams
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const dsaQuestions = getQuestionsForSubject('DSA');
    const dbmsQuestions = getQuestionsForSubject('DBMS');
    const osQuestions = getQuestionsForSubject('Operating Systems');
    const netQuestions = getQuestionsForSubject('Computer Networks');
    const aiQuestions = getQuestionsForSubject('AI Fundamentals');

    const examsData = [
      {
        title: 'Full-Stack DSA & Algorithmic Foundations',
        description: 'Comprehensive evaluation covering binary trees, graph algorithms, dynamic programming, and asymptotic complexity.',
        subject: 'DSA',
        duration: 30,
        questions: dsaQuestions.map((q) => q._id),
        totalMarks: dsaQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarking: true,
        negativeMarkPenalty: 0.25,
        passingPercentage: 60,
        difficulty: 'Medium',
        startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        endTime: futureDate,
        maximumAttempts: 3,
        allowRetake: true,
        status: 'LIVE',
        showResultImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showLeaderboard: true,
        showRank: true,
        showPercentile: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        createdBy: admin._id,
      },
      {
        title: 'Database Systems & Transaction Engineering',
        description: 'Rigorous assessment on Boyce-Codd Normal Form, B+ Tree index design, ACID concurrency semantics, and relational algebra.',
        subject: 'DBMS',
        duration: 25,
        questions: dbmsQuestions.map((q) => q._id),
        totalMarks: dbmsQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarking: true,
        negativeMarkPenalty: 0.25,
        passingPercentage: 50,
        difficulty: 'Medium',
        startTime: now,
        endTime: futureDate,
        maximumAttempts: 2,
        allowRetake: true,
        status: 'LIVE',
        showResultImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showLeaderboard: true,
        showRank: true,
        showPercentile: true,
        randomizeQuestions: true,
        randomizeOptions: false,
        createdBy: admin._id,
      },
      {
        title: 'Operating Systems Core Architecture',
        description: 'Test your understanding of kernel scheduling, Coffman deadlock avoidance, virtual memory paging, and concurrency primitives.',
        subject: 'Operating Systems',
        duration: 20,
        questions: osQuestions.map((q) => q._id),
        totalMarks: osQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarking: false,
        passingPercentage: 45,
        difficulty: 'Easy',
        startTime: now,
        endTime: futureDate,
        maximumAttempts: 1,
        allowRetake: false,
        status: 'LIVE',
        showResultImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showLeaderboard: true,
        showRank: true,
        showPercentile: true,
        createdBy: admin._id,
      },
      {
        title: 'Computer Networks & Protocol Suite',
        description: 'Industry-standard certification exam covering TCP 3-way handshakes, subnetting/CIDR calculations, and OSI routing protocols.',
        subject: 'Computer Networks',
        duration: 25,
        questions: netQuestions.map((q) => q._id),
        totalMarks: netQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarking: true,
        negativeMarkPenalty: 0.25,
        passingPercentage: 50,
        difficulty: 'Medium',
        startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Upcoming tomorrow
        endTime: futureDate,
        maximumAttempts: 2,
        allowRetake: true,
        status: 'SCHEDULED',
        showResultImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showLeaderboard: true,
        showRank: true,
        showPercentile: true,
        createdBy: admin._id,
      },
      {
        title: 'AI Fundamentals & Machine Learning Mock',
        description: 'Evaluates knowledge of gradient dynamics, regularizations (L1/L2), distributed system CAP tradeoffs, and diagnostic metrics.',
        subject: 'AI Fundamentals',
        duration: 25,
        questions: aiQuestions.map((q) => q._id),
        totalMarks: aiQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarking: false,
        passingPercentage: 50,
        difficulty: 'Hard',
        startTime: now,
        endTime: futureDate,
        maximumAttempts: 1,
        allowRetake: false,
        status: 'LIVE',
        showResultImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showLeaderboard: true,
        showRank: true,
        showPercentile: true,
        createdBy: admin._id,
      },
    ];

    const createdExams = await Exam.insertMany(examsData);
    console.log(`[Seed] Created ${createdExams.length} Exams.`);

    // 5. Pre-seed Completed Peer Attempts on DSA Exam to establish an active Leaderboard
    const dsaExam = createdExams[0];
    const peerAnswersPresets = [
      // Sarah: High scorer (nearly all correct)
      {
        user: peers[0],
        correctRatio: 0.95,
        timeTaken: 1120,
      },
      // Marcus: Medium-high
      {
        user: peers[1],
        correctRatio: 0.85,
        timeTaken: 1250,
      },
      // Priya: Good
      {
        user: peers[2],
        correctRatio: 0.75,
        timeTaken: 1400,
      },
      // David: Passing
      {
        user: peers[3],
        correctRatio: 0.65,
        timeTaken: 1550,
      },
    ];

    for (const preset of peerAnswersPresets) {
      const qSnapshots = dsaQuestions.map((q) => ({
        questionId: q._id.toString(),
        version: 1,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: 0.25,
      }));

      const answers = qSnapshots.map((q, idx) => {
        const pickCorrect = Math.random() < preset.correctRatio;
        const selectedOption = pickCorrect
          ? q.correctAnswer
          : q.options.find((o) => o.id !== q.correctAnswer)?.id || 'A';

        return {
          questionId: q.questionId,
          selectedOption,
          visited: true,
          markedForReview: false,
          savedAt: new Date(),
        };
      });

      const attempt = await ExamAttempt.create({
        studentId: preset.user._id,
        examId: dsaExam._id,
        attemptNumber: 1,
        startedAt: new Date(now.getTime() - 2000 * 1000),
        submittedAt: new Date(now.getTime() - (2000 - preset.timeTaken) * 1000),
        expiresAt: new Date(now.getTime() + 1800 * 1000),
        status: 'SUBMITTED',
        questionSnapshots: qSnapshots,
        questionOrder: qSnapshots.map((q) => q.questionId),
        answers,
        currentQuestionIndex: qSnapshots.length - 1,
        timeSpentSeconds: preset.timeTaken,
      });

      const resultData = calculateResultData({ attempt, exam: dsaExam });

      await Result.create({
        attemptId: attempt._id,
        studentId: preset.user._id,
        examId: dsaExam._id,
        ...resultData,
        aiAnalysis: {
          mode: 'RULE_BASED',
          summary: `Assessment successfully evaluated with score ${resultData.score}/${resultData.totalMarks}.`,
          strengths: ['Algorithmic analysis', 'Tree traversals'],
          weakAreas: ['Edge-case complexities'],
          studyPlan: ['Review asymptotic proofs'],
        },
      });

      // Update peer stats
      await User.findByIdAndUpdate(preset.user._id, {
        $set: {
          'stats.testsCompleted': 1,
          'stats.testsTaken': 1,
          'stats.averageScore': resultData.percentage,
          'stats.accuracy': resultData.accuracy,
          'stats.bestScore': resultData.percentage,
          'stats.totalCorrect': resultData.correctCount,
          'stats.totalQuestions': resultData.totalQuestions,
        },
      });
    }

    console.log('[Seed] Pre-seeded peer attempts for dynamic leaderboard verification.');

    // 6. Seed Welcome Notifications
    await Notification.create([
      {
        userId: student._id,
        title: 'Welcome to ExamSphere! 🎓',
        message: 'Your student account is active. Explore available mock assessments, test your skills, and view instant performance insights.',
        type: 'SYSTEM',
        link: '/exams',
      },
      {
        userId: student._id,
        title: 'New Assessment Live: Full-Stack DSA',
        message: 'Full-Stack DSA & Algorithmic Foundations is now open for evaluation. Practice before the deadline!',
        type: 'EXAM_ALERT',
        link: `/exam/${dsaExam._id}`,
      },
    ]);

    // 7. Seed Audit Log
    await AuditLog.create({
      action: 'SYSTEM_SEED',
      performedBy: admin._id,
      entityType: 'SYSTEM',
      details: {
        questions: insertedQuestions.length,
        exams: createdExams.length,
        students: peers.length + 1,
      },
    });

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

runSeed();
