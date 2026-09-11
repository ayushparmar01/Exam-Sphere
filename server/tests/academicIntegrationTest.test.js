const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Department = require('../models/Department');
const Section = require('../models/Section');
const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudyMaterial = require('../models/StudyMaterial');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const SystemSetting = require('../models/SystemSetting');

describe('GLB ExamSphere - College Academic Management & Assessment Integration Tests', () => {
  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';
  let testSection = null;
  let teacherUser = null;
  let studentUser = null;
  let testAssignmentId = '';
  let testSubmissionId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere');
    }

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@examsphere.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // Authenticate Teacher
    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@examsphere.com', password: 'Teacher@123' });
    teacherToken = teacherRes.body.token;
    teacherUser = teacherRes.body.user;

    // Authenticate Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@examsphere.com', password: 'Student@123' });
    studentToken = studentRes.body.token;
    studentUser = studentRes.body.user;

    // Ensure test Section exists
    testSection = await Section.findOne({ departmentCode: 'CSE', year: 3, sectionName: 'A' });
    if (!testSection) {
      testSection = await Section.create({
        departmentCode: 'CSE',
        program: 'B.Tech',
        year: 3,
        sectionName: 'A',
        academicYear: '2025-2026',
        studentCount: 65,
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Academic Hierarchy & System Settings', () => {
    test('GET /api/academic/hierarchy returns departments with structured cohorts', async () => {
      const res = await request(app)
        .get('/api/academic/hierarchy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.hierarchy)).toBe(true);
    });

    test('GET /api/academic/settings returns maxTeachersPerSection = 5', async () => {
      const res = await request(app)
        .get('/api/academic/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.maxTeachersPerSection).toBe(5);
    });
  });

  describe('2. Teacher Section Allocation & Max 5 Teachers Constraint', () => {
    test('Admin can assign a teacher to a section with subject', async () => {
      const res = await request(app)
        .post(`/api/academic/sections/${testSection._id}/teachers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teacherId: teacherUser.id || teacherUser._id,
          subject: 'Data Structures & Algorithms',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    test('Enforces strictly max 5 teachers per section limit', async () => {
      // Create a temporary section for limit testing
      const tempSec = await Section.create({
        departmentCode: 'CSE',
        program: 'B.Tech',
        year: 2,
        sectionName: 'TEST',
        academicYear: '2025-2026',
      });

      // Create 5 dummy teachers
      const dummyTeachers = [];
      for (let i = 1; i <= 6; i++) {
        const t = await User.findOneAndUpdate(
          { email: `dummy.teacher.${i}@examsphere.com` },
          {
            name: `Dummy Teacher ${i}`,
            email: `dummy.teacher.${i}@examsphere.com`,
            role: 'TEACHER',
            department: 'CSE',
          },
          { upsert: true, new: true }
        );
        dummyTeachers.push(t);
      }

      // Assign first 5 teachers (should succeed)
      for (let i = 0; i < 5; i++) {
        const assignRes = await request(app)
          .post(`/api/academic/sections/${tempSec._id}/teachers`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            teacherId: dummyTeachers[i]._id,
            subject: `Subject ${i + 1}`,
          });
        expect([200, 201]).toContain(assignRes.status);
      }

      // Assign 6th teacher (MUST fail with limit exceeded message)
      const sixthRes = await request(app)
        .post(`/api/academic/sections/${tempSec._id}/teachers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teacherId: dummyTeachers[5]._id,
          subject: 'Subject 6',
        });

      expect(sixthRes.status).toBe(400);
      expect(sixthRes.body.message).toMatch(/exceeds maximum allowed limit/i);

      // Cleanup temp section and dummy assignments
      await TeacherSectionAssignment.deleteMany({ sectionId: tempSec._id });
      await Section.findByIdAndDelete(tempSec._id);
      await User.deleteMany({ email: { $regex: /^dummy\.teacher/ } });
    });
  });

  describe('3. Teacher Scope & Student Roster Management', () => {
    test('Teacher can view authorized scopes', async () => {
      const res = await request(app)
        .get('/api/academic/my-scopes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.scopes)).toBe(true);
    });

    test('Teacher can fetch students in their assigned section roster', async () => {
      const res = await request(app)
        .get('/api/academic/students?department=CSE&year=3&section=A')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.students)).toBe(true);
    });
  });

  describe('4. Course Assignments & Submissions Workflow', () => {
    test('Teacher can create an assignment for assigned section', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Automated Test: AVL Tree Rotations',
          description: 'Implement AVL tree rebalancing in C++/Java with verification.',
          subject: 'Data Structures & Algorithms',
          department: 'CSE',
          year: 3,
          section: 'A',
          scope: 'SECTION',
          maxMarks: 20,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          instructions: 'Submit source link and test logs.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      testAssignmentId = res.body.assignment._id;
    });

    test('Student can view published assignments for their section', async () => {
      const res = await request(app)
        .get('/api/assignments/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assignments)).toBe(true);
    });

    test('Student can submit assignment deliverable', async () => {
      const res = await request(app)
        .post(`/api/assignments/${testAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          submissionText: 'https://github.com/alexrivera/avl-rotations - All test cases passing.',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      testSubmissionId = res.body.submission._id;
    });

    test('Teacher can grade student submission with marks & feedback', async () => {
      const res = await request(app)
        .post(`/api/assignments/submissions/${testSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marksObtained: 19,
          feedback: 'Excellent clean implementation and modular rotation routines.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.marksObtained).toBe(19);
      expect(res.body.submission.status).toBe('GRADED');
    });
  });

  describe('5. Study Materials & Notes by Unit', () => {
    test('Students & Teachers can retrieve study materials grouped by unit', async () => {
      const res = await request(app)
        .get('/api/materials')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.groupedMaterials)).toBe(true);
    });
  });

  describe('6. Announcements Feed', () => {
    test('Students receive scoped announcements', async () => {
      const res = await request(app)
        .get('/api/announcements/feed')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.announcements)).toBe(true);
    });
  });

  describe('7. PDF & CSV Academic Reports Generation', () => {
    test('GET /api/reports/section-pdf generates valid binary PDF', async () => {
      const res = await request(app)
        .get('/api/reports/section-pdf?department=CSE&year=3&section=A')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/application\/pdf/);
      expect(res.body.length).toBeGreaterThan(100);
    });

    test('GET /api/reports/section-csv generates CSV roster with student fields', async () => {
      const res = await request(app)
        .get('/api/reports/section-csv?department=CSE&year=3&section=A')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Roll Number');
    });

    test('GET /api/reports/student/:id/progress-pdf generates student progress PDF', async () => {
      const sId = studentUser.id || studentUser._id;
      const res = await request(app)
        .get(`/reports/student/${sId}/progress-pdf`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('8. Student Academic Feedback System', () => {
    test('Student can submit course and exam feedback', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'COURSE',
          subject: 'Data Structures & Algorithms',
          rating: 5,
          message: 'The algorithmic walkthrough in Unit 2 was exceptionally clear.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('Teacher can view feedback for their subjects', async () => {
      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.feedback)).toBe(true);
    });
  });
});
