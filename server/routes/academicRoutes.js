const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const Section = require('../models/Section');
const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const {
  getAcademicHierarchy,
  assignTeacherToSection,
  getStudentsForTeacher,
  getSectionAnalytics,
  getYearAnalytics,
  getCollegeAnalytics,
} = require('../services/academicService');
const { getTeacherAuthorizedScope, canTeacherAccessSection } = require('../middleware/scopeMiddleware');

// Protect all academic routes
router.use(verifyJWT);

/**
 * GET /api/academic/hierarchy
 * Returns Departments -> Years -> Sections structure
 */
router.get('/hierarchy', async (req, res, next) => {
  try {
    const hierarchy = await getAcademicHierarchy();
    res.status(200).json({ success: true, data: hierarchy });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/sections
 * List all sections with optional department/year filtering
 */
router.get('/sections', async (req, res, next) => {
  try {
    const { department, year } = req.query;
    const query = {};
    if (department) query.departmentCode = department.toUpperCase();
    if (year) query.year = Number(year);

    const sections = await Section.find(query)
      .sort({ departmentCode: 1, year: 1, sectionName: 1 })
      .lean();

    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academic/departments
 * Admin creates department
 */
router.post('/departments', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { name, code, programs, years } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      programs: programs || ['B.Tech'],
      years: years || [1, 2, 3, 4],
    });

    res.status(201).json({ success: true, message: 'Department created', data: dept });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academic/sections
 * Admin creates section
 */
router.post('/sections', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { departmentCode, year, sectionName, academicYear, program } = req.body;
    if (!departmentCode || !year || !sectionName) {
      return res.status(400).json({ success: false, message: 'Department, Year, and Section Name required' });
    }

    const section = await Section.create({
      departmentCode: departmentCode.toUpperCase(),
      year: Number(year),
      sectionName: sectionName.toUpperCase(),
      academicYear: academicYear || '2025-26',
      program: program || 'B.Tech',
    });

    res.status(201).json({ success: true, message: 'Section created', data: section });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/teachers/my-sections
 * Returns sections assigned to logged-in teacher
 */
router.get('/teachers/my-sections', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      const allSections = await Section.find().sort({ departmentCode: 1, year: 1, sectionName: 1 }).lean();
      return res.status(200).json({ success: true, data: allSections });
    }

    const assignments = await TeacherSectionAssignment.find({
      teacherId: req.user._id,
      status: 'ACTIVE',
    })
      .populate('sectionId')
      .lean();

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academic/sections/:sectionId/teachers
 * Assign a teacher to a section (Max 5 teachers per section enforced)
 */
router.post('/sections/:sectionId/teachers', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { teacherId, subject } = req.body;
    if (!teacherId || !subject) {
      return res.status(400).json({ success: false, message: 'Teacher ID and Subject are required' });
    }

    const assignment = await assignTeacherToSection({
      teacherId,
      sectionId: req.params.sectionId,
      subject,
      assignedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Teacher assigned to section successfully',
      data: assignment,
    });
  } catch (err) {
    if (err.message.includes('Section teacher limit exceeded')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * DELETE /api/academic/sections/:sectionId/teachers/:teacherId
 * Admin unassigns teacher from section
 */
router.delete('/sections/:sectionId/teachers/:teacherId', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { sectionId, teacherId } = req.params;
    await TeacherSectionAssignment.updateMany(
      { sectionId, teacherId },
      { $set: { status: 'INACTIVE' } }
    );

    res.status(200).json({ success: true, message: 'Teacher removed from section' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/students
 * Teacher Student Management ("My Students" with search, filter, pagination, stats)
 */
router.get('/students', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { search, department, year, section, page, limit } = req.query;

    if (req.user.role === 'ADMIN') {
      // Admin has full college scope
      const query = { role: 'STUDENT' };
      if (department) query.department = department.toUpperCase();
      if (year) query.year = Number(year);
      if (section) query.section = section.toUpperCase();
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const p = Number(page) || 1;
      const l = Number(limit) || 20;
      const skip = (p - 1) * l;
      const total = await User.countDocuments(query);
      const students = await User.find(query)
        .select('-passwordHash')
        .sort({ department: 1, year: 1, section: 1, rollNumber: 1 })
        .skip(skip)
        .limit(l)
        .lean();

      return res.status(200).json({
        success: true,
        data: students,
        total,
        page: p,
        pages: Math.ceil(total / l),
      });
    }

    // Teacher: strictly bounded by teacher's assigned scope
    const result = await getStudentsForTeacher({
      teacherId: req.user._id,
      search,
      department,
      year,
      section,
      page,
      limit,
    });

    res.status(200).json({ success: true, data: result.students, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academic/students
 * Teacher or Admin adds an individual student to an authorized section
 */
router.post('/students', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { name, email, password, department, year, section, rollNumber, program } = req.body;

    if (!name || !email || !department || !year || !section) {
      return res.status(400).json({ success: false, message: 'Name, email, department, year, and section are required' });
    }

    // Scope check: Teachers can only add students to their assigned sections
    if (req.user.role === 'TEACHER') {
      const allowed = await canTeacherAccessSection(req.user._id, department, year, section);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: You do not have teaching assignment in ${department} Yr ${year} Sec ${section}`,
        });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Student@123', salt);

    const student = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'STUDENT',
      department: department.toUpperCase(),
      year: Number(year),
      section: section.toUpperCase(),
      rollNumber: rollNumber || '',
      program: program || 'B.Tech',
      academicYear: '2025-26',
    });

    // Update section student count
    await Section.findOneAndUpdate(
      { departmentCode: department.toUpperCase(), year: Number(year), sectionName: section.toUpperCase() },
      { $inc: { studentCount: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: student.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academic/students/bulk-import
 * Bulk CSV import of students into a section
 */
router.post('/students/bulk-import', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { department, year, section, students } = req.body;

    if (!department || !year || !section || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Department, year, section, and students array required' });
    }

    if (req.user.role === 'TEACHER') {
      const allowed = await canTeacherAccessSection(req.user._id, department, year, section);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this section' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const defaultHash = await bcrypt.hash('Student@123', salt);

    let inserted = 0;
    const errors = [];

    for (const s of students) {
      try {
        if (!s.email || !s.name) continue;
        const email = s.email.toLowerCase().trim();
        const exists = await User.findOne({ email });
        if (exists) {
          errors.push(`Email ${email} already exists`);
          continue;
        }

        await User.create({
          name: s.name.trim(),
          email,
          passwordHash: defaultHash,
          role: 'STUDENT',
          department: department.toUpperCase(),
          year: Number(year),
          section: section.toUpperCase(),
          rollNumber: s.rollNumber || '',
          academicYear: '2025-26',
        });
        inserted++;
      } catch (e) {
        errors.push(`Error adding ${s.email}: ${e.message}`);
      }
    }

    await Section.findOneAndUpdate(
      { departmentCode: department.toUpperCase(), year: Number(year), sectionName: section.toUpperCase() },
      { $inc: { studentCount: inserted } }
    );

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted} students`,
      inserted,
      errors,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/analytics/section
 * Granular section performance analytics
 */
router.get('/analytics/section', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { department, year, section } = req.query;
    if (!department || !year || !section) {
      return res.status(400).json({ success: false, message: 'Department, Year, and Section required' });
    }

    if (req.user.role === 'TEACHER') {
      const allowed = await canTeacherAccessSection(req.user._id, department, year, section);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Scope access denied' });
      }
    }

    const analytics = await getSectionAnalytics({
      department,
      year,
      sectionName: section,
    });

    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/analytics/year
 * Cross-section comparison for a year (CSE 3rd Year A vs B vs C)
 */
router.get('/analytics/year', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const { department, year } = req.query;
    if (!department || !year) {
      return res.status(400).json({ success: false, message: 'Department and Year required' });
    }

    const analytics = await getYearAnalytics({ department, year });
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/analytics/college
 * College-wide overview for Admin
 */
router.get('/analytics/college', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const analytics = await getCollegeAnalytics();
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academic/settings
 * Configurable system settings (e.g. maxTeachersPerSection)
 */
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await SystemSetting.find().lean();
    const settingsObj = {
      maxTeachersPerSection: 5,
      defaultAcademicYear: '2025-26',
    };
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    res.status(200).json({ success: true, data: settingsObj });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/academic/settings
 * Admin updates system settings
 */
router.put('/settings', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and Value are required' });
    }

    const updated = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { value, description: description || '', updatedBy: req.user._id } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Setting updated', data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
