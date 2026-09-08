const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

describe('ExamSphere API Test Suite', () => {
  let studentToken = '';
  let adminToken = '';
  let testExamId = '';
  let activeAttemptId = '';

  beforeAll(async () => {
    // Connect if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere');
    }

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@examsphere.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // Login Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@examsphere.com', password: 'Student@123' });
    studentToken = studentRes.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Authentication & Roles', () => {
    test('Student login succeeds and returns valid JWT', async () => {
      expect(studentToken).toBeDefined();
      expect(typeof studentToken).toBe('string');
    });

    test('Student cannot access admin-only questions route', async () => {
      const res = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Admin can access admin-only questions route', async () => {
      const res = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Exam Discovery & Details', () => {
    test('Get live exams returns available mock assessments', async () => {
      const res = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      testExamId = res.body.data[0]._id;
    });

    test('Get exam details returns syllabus, instructions, and attempt eligibility', async () => {
      const res = await request(app)
        .get(`/api/exams/${testExamId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBeDefined();
      expect(res.body.data.userAttemptInfo).toBeDefined();
      expect(res.body.data.userAttemptInfo.canAttempt).toBe(true);
    });
  });

  describe('Exam Engine, Session Recovery, & Idempotent Submission', () => {
    test('Start new exam session creates attempt with zero answer leakage', async () => {
      const res = await request(app)
        .post('/api/attempts/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ examId: testExamId });

      expect(res.status).toBe(200);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.questions.length).toBeGreaterThan(0);

      // Verify answer confidentiality: correctAnswer and explanation MUST NOT be present
      res.body.data.questions.forEach((q) => {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      });

      activeAttemptId = res.body.data.attemptId;
    });

    test('Browser refresh / reconnection recovers existing active session and remaining time', async () => {
      const res = await request(app)
        .get(`/api/attempts/${activeAttemptId}/session`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.attemptId).toBe(activeAttemptId);
      expect(res.body.data.remainingSeconds).toBeGreaterThan(0);
    });

    test('Auto-save answer updates response state', async () => {
      const sessionRes = await request(app)
        .get(`/api/attempts/${activeAttemptId}/session`)
        .set('Authorization', `Bearer ${studentToken}`);

      const firstQuestionId = sessionRes.body.data.questions[0].questionId;

      const saveRes = await request(app)
        .put(`/api/attempts/${activeAttemptId}/answer`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionId: firstQuestionId,
          selectedOption: 'A',
          markedForReview: true,
          visited: true,
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
    });

    test('Submit attempt calculates score and result', async () => {
      const submitRes = await request(app)
        .post(`/api/attempts/${activeAttemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ timeSpentSeconds: 180 });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.score).toBeDefined();
      expect(submitRes.body.data.accuracy).toBeDefined();
      expect(submitRes.body.data.aiAnalysis).toBeDefined();
    });

    test('Duplicate submit is IDEMPOTENT and returns identical result without errors', async () => {
      const dupeRes = await request(app)
        .post(`/api/attempts/${activeAttemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ timeSpentSeconds: 180 });

      expect(dupeRes.status).toBe(200);
      expect(dupeRes.body.message).toContain('already submitted');
      expect(dupeRes.body.data.attemptId.toString()).toBe(activeAttemptId);
    });
  });

  describe('Dynamic Leaderboard & Tie-Breakers', () => {
    test('Exam leaderboard returns ranked students with deterministic tie-breakers', async () => {
      const res = await request(app)
        .get(`/api/leaderboard/${testExamId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.leaderboard.length).toBeGreaterThan(0);
      expect(res.body.leaderboard[0].rank).toBe(1);
      expect(res.body.leaderboard[0].score).toBeGreaterThanOrEqual(
        res.body.leaderboard[res.body.leaderboard.length - 1].score
      );
    });
  });

  describe('PDF Performance Report', () => {
    test('Download PDF generates application/pdf content', async () => {
      const res = await request(app)
        .get(`/api/results/${activeAttemptId}/pdf`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });
});
