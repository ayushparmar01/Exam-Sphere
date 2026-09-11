const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const User = require('../models/User');

/**
 * Returns all active academic scopes assigned to a teacher
 */
const getTeacherAuthorizedScope = async (teacherId) => {
  const assignments = await TeacherSectionAssignment.find({
    teacherId,
    status: 'ACTIVE',
  }).lean();

  return assignments.map((a) => ({
    departmentCode: a.departmentCode,
    year: a.year,
    sectionName: a.sectionName,
    subject: a.subject,
    sectionId: a.sectionId,
  }));
};

/**
 * Checks if a teacher has authorization over a specific section
 */
const canTeacherAccessSection = async (teacherId, departmentCode, year, sectionName) => {
  const match = await TeacherSectionAssignment.findOne({
    teacherId,
    departmentCode: departmentCode.toUpperCase(),
    year: Number(year),
    sectionName: sectionName.toUpperCase(),
    status: 'ACTIVE',
  });
  return !!match;
};

/**
 * Checks if a teacher has authorization over a student (i.e. student is in one of teacher's sections)
 */
const canTeacherAccessStudent = async (teacherId, studentId) => {
  const student = await User.findById(studentId).lean();
  if (!student || student.role !== 'STUDENT') return false;

  const scopes = await getTeacherAuthorizedScope(teacherId);
  return scopes.some(
    (s) =>
      s.departmentCode === student.department?.toUpperCase() &&
      s.year === student.year &&
      s.sectionName === student.section?.toUpperCase()
  );
};

/**
 * Express middleware to enforce teacher scope authorization.
 * Admins always pass.
 * Teachers must match the requested department/year/section query or body.
 */
const requireTeacherScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({ success: false, message: 'Teacher access required' });
    }

    const dept = req.query.department || req.body.department;
    const year = req.query.year || req.body.year;
    const section = req.query.section || req.body.section || req.query.sectionName || req.body.sectionName;

    // If specific section requested, verify access
    if (dept && year && section) {
      const allowed = await canTeacherAccessSection(req.user._id, dept, year, section);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not assigned to ${dept} Year ${year} Section ${section}.`,
        });
      }
    }

    // Attach authorized scopes to request
    req.teacherScopes = await getTeacherAuthorizedScope(req.user._id);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeacherAuthorizedScope,
  canTeacherAccessSection,
  canTeacherAccessStudent,
  requireTeacherScope,
};
