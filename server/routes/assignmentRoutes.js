const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const User = require('../models/User');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const { canTeacherAccessSection, getTeacherAuthorizedScope } = require('../middleware/scopeMiddleware');

router.use(verifyJWT);

/**
 * GET /api/assignments
 * For Students: Returns assigned assignments matching their department, year, section
 * For Teachers: Returns assignments created by them or in their scope
 * For Admins: Returns all assignments
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, subject } = req.query;

    if (req.user.role === 'STUDENT') {
      const student = await User.findById(req.user._id).lean();
      const now = new Date();

      // Find assignments matching student's placement
      const query = {
        status: { $ne: 'DRAFT' },
        $or: [
          // Targeted to student's specific section
          {
            department: student.department?.toUpperCase(),
            year: student.year,
            sections: student.section?.toUpperCase(),
          },
          // Targeted to entire year
          {
            targetScope: 'YEAR',
            department: student.department?.toUpperCase(),
            year: student.year,
          },
          // Targeted to department
          {
            targetScope: 'DEPARTMENT',
            department: student.department?.toUpperCase(),
          },
          // Targeted directly to student
          {
            targetScope: 'STUDENTS',
            assignedStudents: student._id,
          },
        ],
      };

      if (subject) query.subject = subject;

      const assignments = await Assignment.find(query)
        .populate('createdBy', 'name designation')
        .sort({ dueDate: 1 })
        .lean();

      // Retrieve student's submissions
      const assignmentIds = assignments.map((a) => a._id);
      const submissions = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
        studentId: student._id,
      }).lean();

      // Map completion status
      const mapped = assignments.map((a) => {
        const sub = submissions.find((s) => s.assignmentId.toString() === a._id.toString());
        let computedStatus = 'PENDING';
        if (sub) {
          computedStatus = sub.status === 'GRADED' ? 'COMPLETED' : 'SUBMITTED';
        } else if (new Date(a.dueDate) < now) {
          computedStatus = 'OVERDUE';
        }

        return {
          ...a,
          submission: sub || null,
          computedStatus,
        };
      });

      if (status) {
        const filtered = mapped.filter((m) => m.computedStatus === status.toUpperCase());
        return res.status(200).json({ success: true, count: filtered.length, data: filtered });
      }

      return res.status(200).json({ success: true, count: mapped.length, data: mapped });
    }

    if (req.user.role === 'TEACHER') {
      const query = { createdBy: req.user._id };
      if (status) query.status = status.toUpperCase();
      if (subject) query.subject = subject;

      const assignments = await Assignment.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // Enrich with submission counts
      const aIds = assignments.map((a) => a._id);
      const allSubs = await AssignmentSubmission.find({ assignmentId: { $in: aIds } }).select('assignmentId status').lean();

      const enriched = assignments.map((a) => {
        const subs = allSubs.filter((s) => s.assignmentId.toString() === a._id.toString());
        return {
          ...a,
          submissionCount: subs.length,
          gradedCount: subs.filter((s) => s.status === 'GRADED').length,
        };
      });

      return res.status(200).json({ success: true, count: enriched.length, data: enriched });
    }

    // Admin view
    const query = {};
    if (status) query.status = status.toUpperCase();
    const assignments = await Assignment.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assignments
 * Teacher or Admin creates an assignment
 */
router.post('/', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      instructions,
      targetScope,
      department,
      year,
      sections,
      assignedStudents,
      maxMarks,
      dueDate,
      attachments,
    } = req.body;

    if (!title || !description || !subject || !dueDate || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, subject, due date, department, and year are required',
      });
    }

    // Teachers must be authorized for the section/department
    if (req.user.role === 'TEACHER' && sections && sections.length > 0) {
      for (const sec of sections) {
        const allowed = await canTeacherAccessSection(req.user._id, department, year, sec);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: `Scope violation: You are not authorized to assign work to ${department} Yr ${year} Sec ${sec}`,
          });
        }
      }
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      instructions: instructions || '',
      targetScope: targetScope || 'SECTION',
      department: department.toUpperCase(),
      year: Number(year),
      sections: Array.isArray(sections) ? sections.map((s) => s.toUpperCase()) : ['A'],
      assignedStudents: Array.isArray(assignedStudents) ? assignedStudents : [],
      maxMarks: Number(maxMarks) || 10,
      dueDate: new Date(dueDate),
      attachments: attachments || [],
      createdBy: req.user._id,
      status: 'PUBLISHED',
    });

    res.status(201).json({
      success: true,
      message: 'Assignment published successfully',
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assignments/:id
 * Get details of a single assignment
 */
router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name designation email')
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    let submission = null;
    if (req.user.role === 'STUDENT') {
      submission = await AssignmentSubmission.findOne({
        assignmentId: assignment._id,
        studentId: req.user._id,
      }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ...assignment,
        submission,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assignments/:id/submit
 * Student submits work for an assignment
 */
router.post('/:id/submit', requireRole(['STUDENT']), async (req, res, next) => {
  try {
    const { submissionText, attachments } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Assignment is closed for submissions' });
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: assignment._id, studentId: req.user._id },
      {
        $set: {
          studentName: req.user.name,
          studentRollNumber: req.user.rollNumber || '',
          submissionText: submissionText || '',
          attachments: attachments || [],
          submittedAt: now,
          isLate,
          status: 'SUBMITTED',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully',
      data: submission,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assignments/:id/submissions
 * Teacher views submissions for their assignment
 */
router.get('/:id/submissions', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (req.user.role === 'TEACHER' && assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You did not create this assignment' });
    }

    const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email rollNumber department year section')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/assignments/:id/submissions/:submissionId/grade
 * Teacher grades a submission and gives feedback
 */
router.put('/:id/submissions/:submissionId/grade', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { marksObtained, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (marksObtained === undefined || Number(marksObtained) < 0 || Number(marksObtained) > assignment.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and maximum marks (${assignment.maxMarks})`,
      });
    }

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      req.params.submissionId,
      {
        $set: {
          marksObtained: Number(marksObtained),
          feedback: feedback || '',
          status: 'GRADED',
          gradedBy: req.user._id,
          gradedAt: new Date(),
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Assignment graded successfully',
      data: submission,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
