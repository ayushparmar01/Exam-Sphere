const express = require('express');
const router = express.Router();
const StudyMaterial = require('../models/StudyMaterial');
const User = require('../models/User');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');
const { canTeacherAccessSection } = require('../middleware/scopeMiddleware');

router.use(verifyJWT);

/**
 * GET /api/materials
 * For Students: returns materials matching their department, year, section organized by Subject and Unit
 * For Teachers: returns materials uploaded by teacher or matching filters
 * For Admins: returns all materials
 */
router.get('/', async (req, res, next) => {
  try {
    const { subject, unit, search, department, year } = req.query;

    if (req.user.role === 'STUDENT') {
      const student = await User.findById(req.user._id).lean();

      const query = {
        department: student.department?.toUpperCase(),
        year: student.year,
        $or: [
          { sections: { $size: 0 } },
          { sections: student.section?.toUpperCase() },
        ],
      };

      if (subject) query.subject = subject;
      if (unit) query.unit = unit;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { topic: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const materials = await StudyMaterial.find(query)
        .populate('uploadedBy', 'name designation')
        .sort({ subject: 1, unit: 1, createdAt: -1 })
        .lean();

      // Group materials by Subject and Unit for student UI
      const grouped = {};
      materials.forEach((m) => {
        if (!grouped[m.subject]) grouped[m.subject] = {};
        if (!grouped[m.subject][m.unit]) grouped[m.subject][m.unit] = [];
        grouped[m.subject][m.unit].push(m);
      });

      return res.status(200).json({
        success: true,
        count: materials.length,
        data: materials,
        grouped,
      });
    }

    // Teacher & Admin View
    const query = {};
    if (req.user.role === 'TEACHER') {
      query.uploadedBy = req.user._id;
    }
    if (department) query.department = department.toUpperCase();
    if (year) query.year = Number(year);
    if (subject) query.subject = subject;
    if (unit) query.unit = unit;

    const materials = await StudyMaterial.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/materials
 * Upload study material / notes
 */
router.post('/', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      unit,
      topic,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      department,
      year,
      sections,
    } = req.body;

    if (!title || !subject || !fileUrl || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'Title, Subject, File URL, Department, and Year are required',
      });
    }

    // Teacher scope authorization
    if (req.user.role === 'TEACHER' && sections && sections.length > 0) {
      for (const sec of sections) {
        const allowed = await canTeacherAccessSection(req.user._id, department, year, sec);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: `Scope violation: Not assigned to ${department} Year ${year} Section ${sec}`,
          });
        }
      }
    }

    const material = await StudyMaterial.create({
      title: title.trim(),
      description: description || '',
      subject: subject.trim(),
      unit: unit || 'Unit 1',
      topic: topic || 'General Notes',
      fileUrl,
      fileName: fileName || title,
      fileType: fileType || 'PDF',
      fileSize: Number(fileSize) || 0,
      department: department.toUpperCase(),
      year: Number(year),
      sections: Array.isArray(sections) ? sections.map((s) => s.toUpperCase()) : [],
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully',
      data: material,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/materials/:id/download
 * Increment download count
 */
router.post('/:id/download', async (req, res, next) => {
  try {
    const material = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, downloads: material.downloadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/materials/:id
 * Delete material (Uploader or Admin)
 */
router.delete('/:id', requireRole(['TEACHER', 'ADMIN']), async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    if (req.user.role === 'TEACHER' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this material' });
    }

    await material.deleteOne();
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
