const Department = require('../models/Department');
const Section = require('../models/Section');
const TeacherSectionAssignment = require('../models/TeacherSectionAssignment');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const SystemSetting = require('../models/SystemSetting');
const { getTeacherAuthorizedScope } = require('../middleware/scopeMiddleware');

/**
 * Returns full academic hierarchy (Departments -> Years -> Sections)
 */
const getAcademicHierarchy = async () => {
  const departments = await Department.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean();
  const sections = await Section.find().sort({ departmentCode: 1, year: 1, sectionName: 1 }).lean();
  const assignments = await TeacherSectionAssignment.find({ status: 'ACTIVE' })
    .populate('teacherId', 'name email designation')
    .lean();

  const structure = departments.map((dept) => {
    const deptSections = sections.filter((s) => s.departmentCode === dept.code);
    const yearsGrouped = {};

    dept.years.forEach((yr) => {
      yearsGrouped[yr] = deptSections
        .filter((s) => s.year === yr)
        .map((sec) => {
          const secTeachers = assignments.filter(
            (a) => a.sectionId.toString() === sec._id.toString()
          );
          return {
            ...sec,
            assignedTeachers: secTeachers.map((t) => ({
              id: t.teacherId?._id,
              name: t.teacherId?.name,
              email: t.teacherId?.email,
              subject: t.subject,
            })),
            teacherCount: secTeachers.length,
          };
        });
    });

    return {
      ...dept,
      sectionsByYear: yearsGrouped,
    };
  });

  return structure;
};

/**
 * Assign a teacher to a section for a subject, enforcing max limit
 */
const assignTeacherToSection = async ({ teacherId, sectionId, subject, assignedBy }) => {
  const section = await Section.findById(sectionId);
  if (!section) throw new Error('Section not found');

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== 'TEACHER') {
    throw new Error('Valid teacher account required');
  }

  // Pre-save hook in TeacherSectionAssignment handles maxTeachersPerSection limit check
  const assignment = await TeacherSectionAssignment.findOneAndUpdate(
    {
      teacherId,
      sectionId,
      subject: subject.trim(),
      academicYear: section.academicYear,
    },
    {
      $set: {
        departmentCode: section.departmentCode,
        year: section.year,
        sectionName: section.sectionName,
        assignedBy,
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return assignment;
};

/**
 * Query students assigned to a teacher's authorized sections with pagination, search, & progress stats
 */
const getStudentsForTeacher = async ({ teacherId, search, department, year, section, page = 1, limit = 20 }) => {
  const scopes = await getTeacherAuthorizedScope(teacherId);
  if (!scopes || scopes.length === 0) {
    return { students: [], total: 0, page, pages: 0 };
  }

  // Build match query restricted to teacher scopes
  const scopeConditions = scopes.map((s) => ({
    department: s.departmentCode,
    year: s.year,
    section: s.sectionName,
  }));

  const query = {
    role: 'STUDENT',
    $or: scopeConditions,
  };

  if (department) query.department = department.toUpperCase();
  if (year) query.year = Number(year);
  if (section) query.section = section.toUpperCase();

  if (search) {
    query.$and = [
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  const skip = (page - 1) * limit;
  const total = await User.countDocuments(query);
  const students = await User.find(query)
    .select('-passwordHash')
    .sort({ department: 1, year: 1, section: 1, rollNumber: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Enrich with assignment completion and exam stats
  const studentIds = students.map((s) => s._id);
  const [results, submissions] = await Promise.all([
    Result.find({ studentId: { $in: studentIds } }).select('studentId score percentage isPassed').lean(),
    AssignmentSubmission.find({ studentId: { $in: studentIds } }).select('studentId status marksObtained').lean(),
  ]);

  const enriched = students.map((std) => {
    const stdResults = results.filter((r) => r.studentId.toString() === std._id.toString());
    const stdSubs = submissions.filter((s) => s.studentId.toString() === std._id.toString());

    const totalExams = stdResults.length;
    const avgScore = totalExams > 0
      ? Math.round((stdResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalExams) * 10) / 10
      : 0;

    return {
      ...std,
      examsAttempted: totalExams,
      averageScore: avgScore,
      assignmentsCompleted: stdSubs.filter((s) => s.status === 'GRADED' || s.status === 'SUBMITTED').length,
    };
  });

  return {
    students: enriched,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

/**
 * Calculates granular section analytics (score distribution, pass rate, topics needing revision)
 */
const getSectionAnalytics = async ({ department, year, sectionName }) => {
  const students = await User.find({
    role: 'STUDENT',
    department: department.toUpperCase(),
    year: Number(year),
    section: sectionName.toUpperCase(),
  }).select('_id name rollNumber email').lean();

  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      attemptedCount: 0,
      averageScore: 0,
      passRate: 0,
      scoreDistribution: [],
      needsRevisionTopics: [],
    };
  }

  const studentIds = students.map((s) => s._id);
  const results = await Result.find({ studentId: { $in: studentIds } })
    .populate('examId', 'title subject duration totalMarks')
    .lean();

  const attemptedCount = new Set(results.map((r) => r.studentId.toString())).size;
  const totalResults = results.length;

  const avgScore = totalResults > 0
    ? Math.round((results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalResults) * 10) / 10
    : 0;

  const passedResults = results.filter((r) => r.isPassed).length;
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

  // Score distribution brackets (0-40, 41-60, 61-75, 76-90, 91-100)
  const distribution = [
    { range: '0-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-75%', count: 0 },
    { range: '76-90%', count: 0 },
    { range: '91-100%', count: 0 },
  ];

  results.forEach((r) => {
    const p = r.percentage || 0;
    if (p <= 40) distribution[0].count++;
    else if (p <= 60) distribution[1].count++;
    else if (p <= 75) distribution[2].count++;
    else if (p <= 90) distribution[3].count++;
    else distribution[4].count++;
  });

  // Aggregate topics across attempts to find areas needing revision (average accuracy < 60%)
  const topicMap = {};
  results.forEach((r) => {
    if (r.topicPerformance && Array.isArray(r.topicPerformance)) {
      r.topicPerformance.forEach((tp) => {
        if (!topicMap[tp.topic]) {
          topicMap[tp.topic] = { topic: tp.topic, subject: tp.subject, total: 0, correct: 0 };
        }
        topicMap[tp.topic].total += tp.totalQuestions || 1;
        topicMap[tp.topic].correct += tp.correct || 0;
      });
    }
  });

  const needsRevisionTopics = Object.values(topicMap)
    .map((t) => ({
      topic: t.topic,
      subject: t.subject,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      attempts: t.total,
    }))
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  return {
    department: department.toUpperCase(),
    year: Number(year),
    sectionName: sectionName.toUpperCase(),
    totalStudents,
    attemptedCount,
    averageScore: avgScore,
    passRate,
    scoreDistribution: distribution,
    needsRevisionTopics,
    recentExamCount: totalResults,
  };
};

/**
 * Cross-section comparison for a given year (e.g. CSE 3rd Year A vs B vs C)
 */
const getYearAnalytics = async ({ department, year }) => {
  const sections = await Section.find({
    departmentCode: department.toUpperCase(),
    year: Number(year),
  }).lean();

  const comparisons = await Promise.all(
    sections.map(async (sec) => {
      const stats = await getSectionAnalytics({
        department: sec.departmentCode,
        year: sec.year,
        sectionName: sec.sectionName,
      });
      return {
        sectionName: sec.sectionName,
        totalStudents: stats.totalStudents,
        averageScore: stats.averageScore,
        passRate: stats.passRate,
        attemptedCount: stats.attemptedCount,
      };
    })
  );

  return {
    department: department.toUpperCase(),
    year: Number(year),
    sections: comparisons,
  };
};

/**
 * College-wide academic analytics for Admins
 */
const getCollegeAnalytics = async () => {
  const [totalStudents, totalTeachers, totalExams, totalAssignments, departments] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'TEACHER' }),
    Exam.countDocuments({ status: { $in: ['LIVE', 'ENDED', 'PUBLISHED'] } }),
    Assignment.countDocuments({ status: 'PUBLISHED' }),
    Department.find({ status: 'ACTIVE' }).select('code name').lean(),
  ]);

  const results = await Result.find().select('percentage isPassed studentId').lean();
  const totalResults = results.length;

  const overallAvg = totalResults > 0
    ? Math.round((results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalResults) * 10) / 10
    : 0;

  const overallPassRate = totalResults > 0
    ? Math.round((results.filter((r) => r.isPassed).length / totalResults) * 100)
    : 0;

  return {
    totalStudents,
    totalTeachers,
    totalExams,
    totalAssignments,
    totalAttempts: totalResults,
    overallAverageScore: overallAvg,
    overallPassRate,
    departments,
  };
};

module.exports = {
  getAcademicHierarchy,
  assignTeacherToSection,
  getStudentsForTeacher,
  getSectionAnalytics,
  getYearAnalytics,
  getCollegeAnalytics,
};
