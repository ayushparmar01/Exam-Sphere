process.env.NODE_ENV = 'test';
require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

const runTests = async () => {
  console.log('\n=============================================');
  console.log('  EXAMSPHERE ADVANCED ENTERPRISE TEST SUITE  ');
  console.log('=============================================\n');

  // Start temporary test server
  const testPort = 5099;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  console.log(`[Test Suite] Test server running on http://localhost:${testPort}`);

  // Wait for mongoose
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere');
  }

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    const baseUrl = `http://localhost:${testPort}`;

    // 1. Health Check & Feature Flags
    const healthRes = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    assert(
      healthRes.status === 'HEALTHY' && healthRes.features && healthRes.features.proctoringEngine === 'ACTIVE',
      'Health check returns HEALTHY with active proctoring engine'
    );

    // 2. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@examsphere.com', password: 'Admin@123' }),
    }).then((r) => r.json());
    assert(
      adminLoginRes.success && adminLoginRes.token && adminLoginRes.user.role === 'ADMIN',
      'Admin authentication returns valid JWT and role'
    );
    const adminToken = adminLoginRes.token;

    // 3. Teacher Login
    const teacherLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@examsphere.com', password: 'Teacher@123' }),
    }).then((r) => r.json());
    assert(
      teacherLoginRes.success && teacherLoginRes.token && teacherLoginRes.user.role === 'TEACHER',
      'Teacher authentication returns valid JWT and TEACHER role with department info'
    );
    const teacherToken = teacherLoginRes.token;

    // 4. Dynamic Student Registration & Authentication
    const uniqueEmail = `test_candidate_${Date.now()}@examsphere.com`;
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alex Mercer', email: uniqueEmail, password: 'Password@123' }),
    }).then((r) => r.json());
    assert(
      signupRes.success && signupRes.token && signupRes.user.role === 'STUDENT',
      'Candidate signup returns valid JWT and student role'
    );
    const studentToken = signupRes.token;

    // 5. Role Authorization Guard (Student cannot access Question Bank)
    const studentQRes = await fetch(`${baseUrl}/api/questions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentQRes.status === 403, 'RBAC enforces 403 Forbidden when Student accesses Question Bank');

    // 6. Teacher Question Bank: Create Questions of All 5 Types
    // 6a. Single MCQ
    const singleMcqRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        questionText: 'What is the time complexity of quicksort in average case?',
        questionType: 'SINGLE_MCQ',
        options: [
          { id: 'A', text: 'O(n log n)' },
          { id: 'B', text: 'O(n^2)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(1)' },
        ],
        correctAnswer: 'A',
        subject: 'Algorithms',
        topic: 'Sorting',
        difficulty: 'Medium',
        marks: 2,
        explanation: 'Average case time complexity of quicksort is O(n log n).',
      }),
    }).then((r) => r.json());
    assert(singleMcqRes.success && singleMcqRes.data.questionType === 'SINGLE_MCQ', 'Teacher creates SINGLE_MCQ question');
    const qSingle = singleMcqRes.data;

    // 6b. Multiple MCQ
    const multiMcqRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        questionText: 'Which of the following sorting algorithms have worst-case time complexity of O(n log n)?',
        questionType: 'MULTIPLE_MCQ',
        options: [
          { id: 'A', text: 'Merge Sort' },
          { id: 'B', text: 'Heap Sort' },
          { id: 'C', text: 'Quick Sort' },
          { id: 'D', text: 'Bubble Sort' },
        ],
        correctAnswers: ['A', 'B'],
        subject: 'Algorithms',
        topic: 'Sorting',
        difficulty: 'Hard',
        marks: 4,
        explanation: 'Merge sort and Heap sort both guarantee O(n log n) in the worst case.',
      }),
    }).then((r) => r.json());
    assert(multiMcqRes.success && multiMcqRes.data.questionType === 'MULTIPLE_MCQ', 'Teacher creates MULTIPLE_MCQ question with multiple correct keys');
    const qMulti = multiMcqRes.data;

    // 6c. True / False
    const tfRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        questionText: 'HTTP is a stateless protocol.',
        questionType: 'TRUE_FALSE',
        options: [
          { id: 'T', text: 'True' },
          { id: 'F', text: 'False' },
        ],
        correctAnswer: 'T',
        subject: 'Networking',
        topic: 'HTTP',
        difficulty: 'Easy',
        marks: 1,
        explanation: 'HTTP is stateless by design.',
      }),
    }).then((r) => r.json());
    assert(tfRes.success && tfRes.data.questionType === 'TRUE_FALSE', 'Teacher creates TRUE_FALSE question');
    const qTF = tfRes.data;

    // 6d. Numerical with tolerance
    const numRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        questionText: 'Calculate the value of PI to two decimal places.',
        questionType: 'NUMERICAL',
        numericalAnswer: 3.14,
        numericalTolerance: 0.01,
        subject: 'Mathematics',
        topic: 'Geometry',
        difficulty: 'Easy',
        marks: 2,
        explanation: 'Pi is approximately 3.14159.',
      }),
    }).then((r) => r.json());
    assert(numRes.success && numRes.data.numericalAnswer === 3.14, 'Teacher creates NUMERICAL question with tolerance');
    const qNum = numRes.data;

    // 6e. Fill in the blank
    const fibRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        questionText: 'The process of finding errors and fixing them within a software program is called _______.',
        questionType: 'FILL_BLANK',
        acceptedAnswers: ['debugging', 'debug', 'code debugging'],
        subject: 'Software Engineering',
        topic: 'Testing',
        difficulty: 'Easy',
        marks: 2,
        explanation: 'Debugging is the process of detecting and removing errors.',
      }),
    }).then((r) => r.json());
    assert(fibRes.success && fibRes.data.acceptedAnswers.includes('debugging'), 'Teacher creates FILL_BLANK question with accepted answers');
    const qFib = fibRes.data;

    // 7. Duplicate Question
    const dupeQRes = await fetch(`${baseUrl}/api/questions/${qSingle._id}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
    }).then((r) => r.json());
    assert(dupeQRes.success && dupeQRes.data.questionText.includes('(Copy)'), 'Teacher duplicates an existing question');

    // 8. Archive and Restore Question
    const archiveRes = await fetch(`${baseUrl}/api/questions/${dupeQRes.data._id}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacherToken}` },
    }).then((r) => r.json());
    assert(archiveRes.success && archiveRes.data.status === 'Archived', 'Teacher archives question');

    const restoreRes = await fetch(`${baseUrl}/api/questions/${dupeQRes.data._id}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacherToken}` },
    }).then((r) => r.json());
    assert(restoreRes.success && restoreRes.data.status === 'Active', 'Teacher restores archived question');

    // 9. Teacher Creates and Publishes Exam with Snapshot
    const createExamRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: `Comprehensive Multi-Type Assessment ${Date.now()}`,
        description: 'Exam covering 5 question types with proctoring check',
        subject: 'Computer Science',
        duration: 45,
        passingPercentage: 50,
        difficulty: 'Medium',
        negativeMarking: false,
        maximumAttempts: 3,
        allowRetake: true,
        cameraRequired: true,
        cameraMonitoringEnabled: true,
        microphoneRequired: true,
        microphoneMonitoringEnabled: true,
        fullscreenRequired: true,
        maxFullscreenExits: 3,
        questions: [qSingle._id, qMulti._id, qTF._id, qNum._id, qFib._id],
        status: 'PUBLISHED',
      }),
    }).then((r) => r.json());
    assert(
      createExamRes.success && createExamRes.data._id && createExamRes.data.snapshot && createExamRes.data.snapshot.questions.length === 5,
      'Teacher creates exam with immutable snapshot containing all 5 questions frozen at publish time'
    );
    const liveExam = createExamRes.data;

    // 10. Snapshot Immutability Verification
    // Mutate the original question in database
    await Question.findByIdAndUpdate(qSingle._id, { questionText: 'MUTATED QUESTION TEXT AFTER PUBLISH' });
    const checkExamAfterMutation = await Exam.findById(liveExam._id);
    const frozenQ1 = checkExamAfterMutation.snapshot.questions[0];
    assert(
      frozenQ1.questionText !== 'MUTATED QUESTION TEXT AFTER PUBLISH',
      'IMMUTABILITY: Post-publish question edits in Question Bank do NOT alter frozen Exam Snapshot'
    );

    // 11. Student Starts Attempt on Multi-Type Exam
    const startRes = await fetch(`${baseUrl}/api/attempts/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ examId: liveExam._id }),
    }).then((r) => r.json());
    assert(startRes.success && startRes.data.attemptId, 'Candidate successfully begins attempt on multi-type exam');
    const attemptId = startRes.data.attemptId;

    // Security check: Zero answers leaked across all 5 types
    let answersLeaked = false;
    startRes.data.questions.forEach((q) => {
      if (q.correctAnswer || q.explanation || q.correctAnswers || q.numericalAnswer || q.acceptedAnswers) {
        answersLeaked = true;
      }
    });
    assert(!answersLeaked, 'SECURITY: Zero answers or explanations leaked across SINGLE_MCQ, MULTIPLE_MCQ, NUMERICAL, FILL_BLANK');

    // 12. Proctoring Pre-Flight Device State Telemetry
    const camStateRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/integrity-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        eventType: 'CAMERA_ACTIVE',
        metadata: { cameraState: 'CAMERA_ACTIVE', microphoneState: 'MICROPHONE_ACTIVE' },
      }),
    }).then((r) => r.json());
    assert(camStateRes.success === true, 'Telemetry records CAMERA_ACTIVE and MICROPHONE_ACTIVE device states');

    // 13. Answer Autosave for Different Question Types
    // Answer Single MCQ
    const saveSingleRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        questionId: qSingle._id.toString(),
        selectedOption: 'A', // Correct
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveSingleRes.success === true, 'Autosaves SINGLE_MCQ choice');

    // Answer Multiple MCQ
    const saveMultiRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        questionId: qMulti._id.toString(),
        selectedOptions: ['A', 'B'], // Correct
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveMultiRes.success === true, 'Autosaves MULTIPLE_MCQ choices');

    // Answer True/False
    const saveTFRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        questionId: qTF._id.toString(),
        selectedOption: 'T', // Correct
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveTFRes.success === true, 'Autosaves TRUE_FALSE choice');

    // Answer Numerical
    const saveNumRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        questionId: qNum._id.toString(),
        numericalValue: 3.141, // Within 0.01 tolerance of 3.14
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveNumRes.success === true, 'Autosaves NUMERICAL value');

    // Answer Fill in the Blank
    const saveFibRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        questionId: qFib._id.toString(),
        textAnswer: 'debugging', // Case-insensitive match
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveFibRes.success === true, 'Autosaves FILL_BLANK text');

    // 14. Exam Submission & Multi-Type Evaluation
    const submitRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ timeSpentSeconds: 180 }),
    }).then((r) => r.json());

    if (!submitRes.success || submitRes.data?.percentage !== 100 || !submitRes.data?.isPassed) {
      console.log('Submission result detail:', JSON.stringify(submitRes.data?.questionReview, null, 2));
    }
    assert(
      submitRes.success && submitRes.data.percentage === 100 && submitRes.data.isPassed === true,
      'Multi-Type Scoring Engine awards 100% across Single MCQ, Multi MCQ, True/False, Numerical (tolerance), and Fill in the Blank'
    );

    // 15. Teacher Analytics Endpoint
    const teacherAnalyticsRes = await fetch(`${baseUrl}/api/analytics/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    }).then((r) => r.json());
    assert(
      teacherAnalyticsRes.success && teacherAnalyticsRes.data.kpis && teacherAnalyticsRes.data.questionAnalytics,
      'Teacher Analytics endpoint returns KPI cards, score distributions, and question difficulty breakdown'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n---------------------------------------------');
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('---------------------------------------------\n');

    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
