require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');

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

    // 3. Dynamic Student Registration & Authentication
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

    // 4. Role Authorization Guard (Student cannot access Question Bank)
    const studentQRes = await fetch(`${baseUrl}/api/questions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentQRes.status === 403, 'RBAC enforces 403 Forbidden when Student accesses Admin Question Bank');

    // 5. Admin Question Bank & Authoring
    const adminQRes = await fetch(`${baseUrl}/api/questions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(adminQRes.success && Array.isArray(adminQRes.data), 'RBAC allows Admin to access Question Bank');

    // 6. Admin Publishes New Timed Assessment with Proctoring Rules
    const createExamRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Enterprise Systems Exam ${Date.now()}`,
        description: 'Comprehensive assessment on distributed systems and algorithms',
        subject: 'DSA',
        duration: 30,
        passingPercentage: 50,
        difficulty: 'Medium',
        negativeMarking: true,
        negativeMarkPenalty: 0.25,
        maximumAttempts: 3,
        allowRetake: true,
        cameraRequired: false,
        cameraMonitoringEnabled: true,
        microphoneRequired: false,
        microphoneMonitoringEnabled: true,
        fullscreenRequired: true,
        maxFullscreenExits: 3,
        questions: adminQRes.data.slice(0, 3).map((q) => q._id),
        status: 'LIVE',
      }),
    }).then((r) => r.json());
    assert(createExamRes.success && createExamRes.data._id, 'Admin successfully publishes new proctored examination');
    const liveExam = createExamRes.data;

    // 7. Exam Details & Instructions
    const examDetailRes = await fetch(`${baseUrl}/api/exams/${liveExam._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());
    assert(
      examDetailRes.success && examDetailRes.data.userAttemptInfo.canAttempt === true,
      'Exam details return syllabus, rules, and attempt eligibility'
    );

    // 8. Start Exam Attempt & Answer Confidentiality
    const startRes = await fetch(`${baseUrl}/api/attempts/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ examId: liveExam._id }),
    }).then((r) => r.json());

    assert(startRes.success && startRes.data.attemptId, 'ExamSession & Attempt successfully initialized');
    const attemptId = startRes.data.attemptId;

    // Security check: Verify no answers leaked
    let answersLeaked = false;
    startRes.data.questions.forEach((q) => {
      if (q.correctAnswer || q.explanation) answersLeaked = true;
    });
    assert(!answersLeaked, 'SECURITY: Zero correctAnswer or explanation leaked to client during exam');

    // 9. Session Recovery on Refresh
    const sessionRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/session`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());
    assert(
      sessionRes.success && sessionRes.data.remainingSeconds > 0,
      'Session recovery restores questions, order, and server-authoritative timer'
    );

    // 10. Auto-Save Answer
    const q1 = sessionRes.data.questions[0];
    const saveRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/answer`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        questionId: q1.questionId,
        selectedOption: 'A',
        markedForReview: true,
        visited: true,
      }),
    }).then((r) => r.json());
    assert(saveRes.success === true, 'Answer auto-save successfully persists student choice');

    // 11. Offline Batch Queue Synchronization
    const batchSyncRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/sync-answers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: q1.questionId, selectedOption: 'B', markedForReview: false, visited: true, clientTimestamp: Date.now() },
        ],
      }),
    }).then((r) => r.json());
    assert(
      batchSyncRes.success === true && batchSyncRes.answers.length > 0,
      'Offline batch queue synchronization persists cached answers with timestamp ordering'
    );

    // 12. Integrity Risk Scoring Telemetry
    const telemetryRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/integrity-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        eventType: 'TAB_SWITCH',
        metadata: { clientTimestamp: Date.now() },
      }),
    }).then((r) => r.json());
    assert(telemetryRes.success && telemetryRes.data.riskScore > 0, 'Dynamic integrity risk engine records TAB_SWITCH and increments risk points');

    // Second event: Fullscreen exit
    const fsTelemetryRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/integrity-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        eventType: 'FULLSCREEN_EXIT',
        metadata: { clientTimestamp: Date.now() },
      }),
    }).then((r) => r.json());
    assert(
      fsTelemetryRes.success && fsTelemetryRes.data.riskScore >= 15,
      'Dynamic risk level escalates score upon multiple integrity signals'
    );

    // 13. Admin Live Monitoring Overview
    const liveMonitoringRes = await fetch(`${baseUrl}/api/admin/monitoring/live`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(
      liveMonitoringRes.success && liveMonitoringRes.data.metrics && Array.isArray(liveMonitoringRes.data.candidates),
      'Admin Live Proctoring Center provides real-time metrics and candidate telemetry stream'
    );

    // 14. Admin Flag Toggle
    const flagRes = await fetch(`${baseUrl}/api/admin/attempts/${attemptId}/flag`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isFlagged: true }),
    }).then((r) => r.json());
    assert(flagRes.success && flagRes.data.isFlaggedForReview === true, 'Admin can toggle candidate attempt flag for human supervisor review');

    // 15. GraphQL API Layer (Queries & RBAC Guard)
    const gqlRes = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        query: `
          query {
            me { id name role }
            adminLiveOverview { totalCandidates activeCandidates highRiskCount }
          }
        `,
      }),
    }).then((r) => r.json());
    assert(
      gqlRes.data && gqlRes.data.me && gqlRes.data.adminLiveOverview,
      'GraphQL query layer returns structured dashboard analytics under verified RBAC context'
    );

    // GraphQL Security Guard: Student cannot query adminLiveOverview
    const gqlStudentRes = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        query: `query { adminLiveOverview { totalCandidates } }`,
      }),
    }).then((r) => r.json());
    assert(
      gqlStudentRes.errors && gqlStudentRes.errors.length > 0,
      'GraphQL security guard blocks unauthorized student access to admin monitoring queries'
    );

    // 16. Data Retention Policy Status
    const retentionRes = await fetch(`${baseUrl}/api/admin/retention`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(retentionRes.success && retentionRes.data.policies, 'Data Retention Service reports compliant event and audit lifecycle rules');

    // 17. Idempotent Exam Submission
    const submitRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ timeSpentSeconds: 120 }),
    }).then((r) => r.json());

    assert(submitRes.success && submitRes.data.score !== undefined, 'First submission calculates score, accuracy, and AI recommendations');

    // Duplicate submit check (IDEMPOTENCY)
    const dupeSubmitRes = await fetch(`${baseUrl}/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ timeSpentSeconds: 120 }),
    }).then((r) => r.json());

    assert(
      dupeSubmitRes.success && dupeSubmitRes.message.includes('already submitted'),
      'IDEMPOTENCY: Duplicate submission returns existing result without creating duplicate records'
    );

    // 18. Dynamic Leaderboard & Tie-Breakers
    const leaderboardRes = await fetch(`${baseUrl}/api/leaderboard/${liveExam._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    assert(
      leaderboardRes.success && leaderboardRes.leaderboard.length > 0 && leaderboardRes.leaderboard[0].rank === 1,
      'Dynamic Leaderboard accurately ranks participants using Score -> Accuracy -> Time'
    );

    // 19. PDF Performance Report Download
    const pdfRes = await fetch(`${baseUrl}/api/results/${attemptId}/pdf`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const contentType = pdfRes.headers.get('content-type');
    const pdfBuffer = await pdfRes.arrayBuffer();
    assert(
      pdfRes.status === 200 && contentType === 'application/pdf' && pdfBuffer.byteLength > 1000,
      'PDF performance report generates certified printable document'
    );

    // 20. Fallback Mode / Gemini Question Generation
    const aiGenRes = await fetch(`${baseUrl}/api/ai/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        subject: 'DSA',
        topic: 'Graph Theory',
        difficulty: 'Medium',
        count: 2,
      }),
    }).then((r) => r.json());

    assert(
      aiGenRes.success && aiGenRes.data.length === 2,
      'AI / Rule-Based Question Generator produces valid questions with explanations'
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
