const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  generateStudentProgressPDF,
  generateSectionReportPDF,
  generateExamReportPDF,
} = require('../services/pdfService');
const { getSectionAnalytics, getStudentsForTeacher } = require('../services/academicService');
const { canTeacherAccessStudent, canTeacherAccessSection } = require('../middleware/scopeMiddleware');

router.use(verifyJWT);

/**
 * GET /api/reports/student/:studentId/pdf
 * Generate Individual Student Academic Progress PDF
 */
router.get('/student/:studentId/pdf', requireRole(['TEACHER', 'ADMIN', 'STUDENT']), async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    // Authorization check
    if (req.user.role === 'STUDENT' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own report' });
    }

    if (req.user.role === 'TEACHER') {
      const allowed = await canTeacherAccessStudent(req.user._id, studentId);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied: Student is outside your assigned sections' });
      }
    }

    const student = await User.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [results, assignments, examsWithComments] = await Promise.all([
      Result.find({ studentId: student._id }).populate('examId', 'title subject duration totalMarks').sort({ createdAt: -1 }).lean(),
      AssignmentSubmission.find({ studentId: student._id }).populate('assignmentId', 'title subject maxMarks dueDate').lean(),
      Exam.find({ 'teacherComments.studentId': student._id }).select('title teacherComments').lean(),
    ]);

    // Extract comments for this student
    const studentComments = [];
    examsWithComments.forEach((e) => {
      (e.teacherComments || []).forEach((c) => {
        if (c.studentId.toString() === student._id.toString()) {
          studentComments.push({ ...c, examTitle: e.title });
        }
      });
    });

    const pdfBuffer = await generateStudentProgressPDF({
      student,
      results,
      assignments,
      teacherComments: studentComments,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="GLB_Report_${student.rollNumber || student.name.replace(/\s+/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/section/pdf
 * Generate Section Performance Report PDF
 */
router.get('/section/pdf', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { department, year, section } = req.query;
    if (!department || !year || !section) {
      return res.status(400).json({ success: false, message: 'Department, Year, and Section are required' });
    }

    if (req.user.role === 'TEACHER') {
      const allowed = await canTeacherAccessSection(req.user._id, department, year, section);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied: Not assigned to this section' });
      }
    }

    const [stats, studentRoster] = await Promise.all([
      getSectionAnalytics({ department, year, sectionName: section }),
      getStudentsForTeacher({ teacherId: req.user._id, department, year, section, limit: 100 }),
    ]);

    const pdfBuffer = await generateSectionReportPDF({
      department,
      year,
      sectionName: section,
      stats,
      students: studentRoster.students || [],
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Section_Report_${department}_Yr${year}_Sec${section}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/exam/:examId/pdf
 * Generate Exam Analytics Report PDF
 */
router.get('/exam/:examId/pdf', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId).lean();
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const results = await Result.find({ examId: exam._id })
      .populate('studentId', 'name email rollNumber department year section')
      .lean();

    const pdfBuffer = await generateExamReportPDF({
      exam,
      results,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Exam_Report_${exam.title.replace(/\s+/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/export/students-csv
 * CSV export of students with exam and assignment stats
 */
router.get('/export/students-csv', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { department, year, section } = req.query;

    const result = await getStudentsForTeacher({
      teacherId: req.user._id,
      department,
      year,
      section,
      limit: 1000,
    });

    const students = result.students || [];

    // Construct CSV Header and Rows
    const headers = [
      'Roll Number',
      'Full Name',
      'Email',
      'Department',
      'Year',
      'Section',
      'Exams Attempted',
      'Average Score (%)',
      'Assignments Completed',
    ];

    const rows = students.map((s) => [
      `"${s.rollNumber || ''}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department || ''}"`,
      `"${s.year || ''}"`,
      `"${s.section || ''}"`,
      s.examsAttempted || 0,
      s.averageScore || 0,
      s.assignmentsCompleted || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="GLB_Students_Export_${Date.now()}.csv"`,
    });

    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/export/exam-results-csv
 * CSV export of exam candidates and scores
 */
router.get('/export/exam-results-csv', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { examId } = req.query;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Exam ID required' });
    }

    const results = await Result.find({ examId })
      .populate('studentId', 'name email rollNumber department year section')
      .populate('examId', 'title subject totalMarks passingPercentage')
      .sort({ score: -1 })
      .lean();

    const headers = [
      'Candidate Name',
      'Roll Number',
      'Email',
      'Department',
      'Year',
      'Section',
      'Score Obtained',
      'Total Marks',
      'Percentage (%)',
      'Accuracy (%)',
      'Status',
      'Time Taken (Seconds)',
      'Attempt Date',
    ];

    const rows = results.map((r) => [
      `"${r.studentId?.name || ''}"`,
      `"${r.studentId?.rollNumber || ''}"`,
      `"${r.studentId?.email || ''}"`,
      `"${r.studentId?.department || ''}"`,
      `"${r.studentId?.year || ''}"`,
      `"${r.studentId?.section || ''}"`,
      r.score,
      r.totalMarks,
      r.percentage,
      r.accuracy,
      r.isPassed ? 'PASSED' : 'FAILED',
      r.timeTakenSeconds,
      `"${new Date(r.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="Exam_Results_${examId}.csv"`,
    });

    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
