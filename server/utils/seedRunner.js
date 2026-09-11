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
const Department = require('../models/Department');
const Section = require('../models/Section');
const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudyMaterial = require('../models/StudyMaterial');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const SystemSetting = require('../models/SystemSetting');
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
      Department.deleteMany({}),
      Section.deleteMany({}),
      TeacherSectionAssignment.deleteMany({}),
      Assignment.deleteMany({}),
      AssignmentSubmission.deleteMany({}),
      StudyMaterial.deleteMany({}),
      Announcement.deleteMany({}),
      Feedback.deleteMany({}),
      SystemSetting.deleteMany({}),
    ]);

    // 1. Create System Setting for Teacher Section Limit
    await SystemSetting.create({
      key: 'maxTeachersPerSection',
      value: 5,
      description: 'Maximum number of teachers that can be assigned to a single section',
    });

    // 2. Seed Academic Departments & Sections
    const depts = await Department.create([
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        programs: ['B.Tech', 'M.Tech'],
        years: [1, 2, 3, 4],
        status: 'ACTIVE',
      },
      {
        name: 'Information Technology',
        code: 'IT',
        programs: ['B.Tech'],
        years: [1, 2, 3, 4],
        status: 'ACTIVE',
      },
      {
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        programs: ['B.Tech'],
        years: [1, 2, 3, 4],
        status: 'ACTIVE',
      },
    ]);

    const sections = await Section.create([
      { departmentCode: 'CSE', program: 'B.Tech', year: 3, sectionName: 'A', academicYear: '2025-2026', studentCount: 65 },
      { departmentCode: 'CSE', program: 'B.Tech', year: 3, sectionName: 'B', academicYear: '2025-2026', studentCount: 62 },
      { departmentCode: 'CSE', program: 'B.Tech', year: 3, sectionName: 'C', academicYear: '2025-2026', studentCount: 60 },
      { departmentCode: 'CSE', program: 'B.Tech', year: 2, sectionName: 'A', academicYear: '2025-2026', studentCount: 64 },
      { departmentCode: 'CSE', program: 'B.Tech', year: 2, sectionName: 'B', academicYear: '2025-2026', studentCount: 63 },
      { departmentCode: 'IT', program: 'B.Tech', year: 3, sectionName: 'A', academicYear: '2025-2026', studentCount: 58 },
      { departmentCode: 'IT', program: 'B.Tech', year: 3, sectionName: 'B', academicYear: '2025-2026', studentCount: 57 },
    ]);

    // 3. Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const studentPasswordHash = await bcrypt.hash('Student@123', salt);
    const teacherPasswordHash = await bcrypt.hash('Teacher@123', salt);

    const admin = await User.create({
      name: 'ExamSphere Administrator',
      email: 'admin@examsphere.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    // 4. Create Teacher
    const teacher = await User.create({
      name: 'Prof. Alan Turing',
      email: 'teacher@examsphere.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      department: 'CSE',
      designation: 'Associate Professor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    });

    // Assign Teacher to Sections
    const cseYear3SecA = sections.find((s) => s.departmentCode === 'CSE' && s.year === 3 && s.sectionName === 'A');
    const cseYear3SecB = sections.find((s) => s.departmentCode === 'CSE' && s.year === 3 && s.sectionName === 'B');

    await TeacherSectionAssignment.create([
      {
        teacherId: teacher._id,
        sectionId: cseYear3SecA._id,
        departmentCode: 'CSE',
        year: 3,
        sectionName: 'A',
        subject: 'Data Structures & Algorithms',
        academicYear: '2025-2026',
        assignedBy: admin._id,
      },
      {
        teacherId: teacher._id,
        sectionId: cseYear3SecB._id,
        departmentCode: 'CSE',
        year: 3,
        sectionName: 'B',
        subject: 'Data Structures & Algorithms',
        academicYear: '2025-2026',
        assignedBy: admin._id,
      },
    ]);

    // 5. Create Students with full academic profile
    const student = await User.create({
      name: 'Alex Rivera',
      email: 'student@examsphere.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      rollNumber: '2101330100042',
      enrollmentNumber: 'GLB21CS042',
      department: 'CSE',
      program: 'B.Tech',
      year: 3,
      section: 'A',
      academicYear: '2025-2026',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });

    const peers = await User.create([
      {
        name: 'Sarah Chen',
        email: 'sarah@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        rollNumber: '2101330100088',
        enrollmentNumber: 'GLB21CS088',
        department: 'CSE',
        program: 'B.Tech',
        year: 3,
        section: 'A',
        academicYear: '2025-2026',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        rollNumber: '2101330100065',
        enrollmentNumber: 'GLB21CS065',
        department: 'CSE',
        program: 'B.Tech',
        year: 3,
        section: 'A',
        academicYear: '2025-2026',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        rollNumber: '2101330100091',
        enrollmentNumber: 'GLB21CS091',
        department: 'CSE',
        program: 'B.Tech',
        year: 3,
        section: 'B',
        academicYear: '2025-2026',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'David Kim',
        email: 'david@examsphere.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        rollNumber: '2101330100034',
        enrollmentNumber: 'GLB21CS034',
        department: 'CSE',
        program: 'B.Tech',
        year: 3,
        section: 'B',
        academicYear: '2025-2026',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
    ]);

    console.log(`[Seed] Created 1 Admin, 1 Teacher (assigned to 2 sections), and ${peers.length + 1} Academic Students.`);

    // 4. Insert Questions with dual ownership (Admin & Teacher)
    const questionsToInsert = sampleQuestions.map((q, idx) => ({
      ...q,
      createdBy: idx % 2 === 0 ? teacher._id : admin._id,
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
        targetScope: 'SECTION',
        targetDepartment: 'CSE',
        targetYear: 3,
        targetSections: ['A', 'B'],
        academicYear: '2025-2026',
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

    const proctoredExamsData = examsData.map((e, idx) => {
      const qDocs = insertedQuestions.filter((q) => e.questions.some((eqId) => eqId.toString() === q._id.toString()));
      const snapshot = {
        frozenAt: new Date(),
        questions: qDocs.map((q) => ({
          questionId: q._id.toString(),
          version: 1,
          questionText: q.questionText,
          questionType: q.questionType || 'SINGLE_MCQ',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          correctAnswers: q.correctAnswers || [],
          acceptedAnswers: q.acceptedAnswers || [],
          numericalAnswer: typeof q.numericalAnswer === 'number' ? q.numericalAnswer : null,
          numericalTolerance: q.numericalTolerance || 0,
          explanation: q.explanation || '',
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty || 'Medium',
          marks: q.marks || 1,
          negativeMarks: e.negativeMarking ? (e.negativeMarkPenalty || 0.25) : 0,
        })),
        rules: {
          duration: e.duration,
          totalMarks: e.totalMarks,
          passingPercentage: e.passingPercentage,
          negativeMarking: e.negativeMarking,
          negativeMarkPenalty: e.negativeMarkPenalty,
          maximumAttempts: e.maximumAttempts,
          allowRetake: e.allowRetake,
          randomizeQuestions: e.randomizeQuestions,
          randomizeOptions: e.randomizeOptions,
          cameraRequired: true,
          microphoneRequired: true,
          fullscreenRequired: true,
        },
      };

      return {
        cameraRequired: true,
        cameraMonitoringEnabled: true,
        microphoneRequired: true,
        microphoneMonitoringEnabled: true,
        fullscreenRequired: true,
        maxFullscreenExits: 3,
        facePresenceMonitoringEnabled: true,
        multipleFaceDetectionEnabled: true,
        snapshot,
        ...e,
        createdBy: idx % 2 === 0 ? teacher._id : admin._id,
      };
    });

    const createdExams = await Exam.insertMany(proctoredExamsData);
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

    // 6. Seed Academic Assignments
    const asg1 = await Assignment.create({
      title: 'Design Pattern Implementation: Strategy & Factory Patterns',
      description: 'Implement flexible behavioral and creational design patterns in Java/TypeScript with unit test validation.',
      subject: 'Software Engineering',
      department: 'CSE',
      year: 3,
      section: 'A',
      scope: 'SECTION',
      academicYear: '2025-2026',
      instructions: 'Submit a comprehensive implementation report and unit test coverage exceeding 80%.',
      maxMarks: 20,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: teacher._id,
      status: 'PUBLISHED',
    });

    const asg2 = await Assignment.create({
      title: 'Dynamic Programming Graph Optimization',
      description: 'Analyze time-space tradeoffs between Bellman-Ford and Floyd-Warshall for all-pairs shortest paths.',
      subject: 'Data Structures & Algorithms',
      department: 'CSE',
      year: 3,
      section: 'A',
      scope: 'SECTION',
      academicYear: '2025-2026',
      instructions: 'Provide complexity derivations and benchmark outputs for dense and sparse topologies.',
      maxMarks: 25,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdBy: teacher._id,
      status: 'PUBLISHED',
    });

    // 7. Seed Student Assignment Submission
    await AssignmentSubmission.create({
      assignmentId: asg1._id,
      studentId: student._id,
      submissionText: 'Implemented Strategy pattern for dynamic pricing and Factory for notification providers. All tests passing with 92% coverage.',
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'GRADED',
      marksObtained: 18,
      feedback: 'Excellent modular structure and clean unit tests. Well documented edge cases.',
      gradedBy: teacher._id,
      gradedAt: new Date(),
    });

    // 8. Seed Study Materials (Unit 1, Unit 2, Unit 3)
    await StudyMaterial.create([
      {
        title: 'Asymptotic Analysis & Recurrence Relations',
        subject: 'Data Structures & Algorithms',
        unit: 'Unit 1',
        topic: 'Master Theorem & Big-O Notation',
        description: 'Comprehensive lecture slides covering divide-and-conquer recurrence equations and asymptotic bounds.',
        department: 'CSE',
        year: 3,
        sections: ['A', 'B', 'C'],
        fileUrl: '/uploads/materials/dsa-unit1-asymptotic.pdf',
        fileType: 'pdf',
        fileSize: 2450000,
        uploadedBy: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Self-Balancing Binary Search Trees',
        subject: 'Data Structures & Algorithms',
        unit: 'Unit 2',
        topic: 'AVL & Red-Black Tree Rotations',
        description: 'Illustrated walkthrough of LL, RR, LR, RL tree rotations and logarithmic search invariant guarantees.',
        department: 'CSE',
        year: 3,
        sections: ['A', 'B', 'C'],
        fileUrl: '/uploads/materials/dsa-unit2-trees.pdf',
        fileType: 'pdf',
        fileSize: 3100000,
        uploadedBy: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Graph Algorithms & Shortest Path Protocols',
        subject: 'Data Structures & Algorithms',
        unit: 'Unit 3',
        topic: 'Dijkstra and Bellman-Ford Shortest Path',
        description: 'Comparative analysis of single-source shortest path routing algorithms with negative cycle detection.',
        department: 'CSE',
        year: 3,
        sections: ['A', 'B', 'C'],
        fileUrl: '/uploads/materials/dsa-unit3-graphs.pdf',
        fileType: 'pdf',
        fileSize: 4200000,
        uploadedBy: teacher._id,
        status: 'ACTIVE',
      },
    ]);

    // 9. Seed Announcements
    await Announcement.create([
      {
        title: 'Mid-Term Assessment Schedule - Odd Semester 2025-2026',
        message: 'Mid-term examinations for B.Tech CSE 3rd Year commence on October 15. Verify your assigned lab slots and student ID credentials.',
        scope: 'YEAR',
        department: 'CSE',
        year: 3,
        priority: 'HIGH',
        createdBy: admin._id,
      },
      {
        title: 'Annual Technical Symposium & Project Exhibition',
        message: 'Submissions for the GLB Innovation Summit are open. All department students can register working prototypes.',
        scope: 'COLLEGE',
        priority: 'NORMAL',
        createdBy: admin._id,
      },
    ]);

    // 10. Seed Academic Course Feedback
    await Feedback.create([
      {
        category: 'COURSE',
        subject: 'Data Structures & Algorithms',
        department: 'CSE',
        year: 3,
        section: 'A',
        studentId: student._id,
        rating: 5,
        message: 'The interactive tree rotation visuals in Unit 2 made complex balancing logic very intuitive.',
        isAnonymous: false,
      },
    ]);

    // 11. Seed Welcome Notifications
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
