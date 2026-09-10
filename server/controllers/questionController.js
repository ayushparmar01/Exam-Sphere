const Question = require('../models/Question');
const { paginateQuery } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');
const fs = require('fs');
const csv = require('csv-parser');

// Helper to validate question types
const validateQuestionPayload = (payload) => {
  const {
    questionText,
    questionType = 'SINGLE_MCQ',
    options = [],
    correctAnswer = '',
    correctAnswers = [],
    acceptedAnswers = [],
    numericalAnswer = null,
    numericalTolerance = 0,
    explanation,
    subject,
    topic,
  } = payload;

  if (!questionText || !questionText.trim()) {
    return 'Question text is required.';
  }
  if (!subject || !subject.trim()) {
    return 'Subject is required.';
  }
  if (!topic || !topic.trim()) {
    return 'Topic is required.';
  }
  if (!explanation || !explanation.trim()) {
    return 'Explanation is required.';
  }

  const validTypes = ['SINGLE_MCQ', 'MULTIPLE_MCQ', 'TRUE_FALSE', 'NUMERICAL', 'FILL_BLANK'];
  if (!validTypes.includes(questionType)) {
    return `Invalid questionType "${questionType}". Must be one of: ${validTypes.join(', ')}`;
  }

  if (questionType === 'SINGLE_MCQ') {
    if (!Array.isArray(options) || options.length < 2) {
      return 'Single MCQ questions must have at least 2 options.';
    }
    const optionIds = new Set();
    for (const opt of options) {
      if (!opt.id || !opt.text || !opt.text.trim()) {
        return 'All options must have an ID and text.';
      }
      if (optionIds.has(opt.id)) {
        return `Duplicate option ID "${opt.id}" detected.`;
      }
      optionIds.add(opt.id);
    }
    if (!correctAnswer || !optionIds.has(correctAnswer.trim().toUpperCase())) {
      return `Correct answer "${correctAnswer}" must match one of the option IDs (${[...optionIds].join(', ')}).`;
    }
  } else if (questionType === 'MULTIPLE_MCQ') {
    if (!Array.isArray(options) || options.length < 2) {
      return 'Multiple MCQ questions must have at least 2 options.';
    }
    const optionIds = new Set();
    for (const opt of options) {
      if (!opt.id || !opt.text || !opt.text.trim()) {
        return 'All options must have an ID and text.';
      }
      if (optionIds.has(opt.id)) {
        return `Duplicate option ID "${opt.id}" detected.`;
      }
      optionIds.add(opt.id);
    }
    if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
      return 'Multiple MCQ questions must have at least one correct answer selected in correctAnswers.';
    }
    for (const ca of correctAnswers) {
      if (!optionIds.has(String(ca).trim().toUpperCase())) {
        return `Correct answer "${ca}" is not in options (${[...optionIds].join(', ')}).`;
      }
    }
  } else if (questionType === 'TRUE_FALSE') {
    const validAns = ['T', 'F', 'TRUE', 'FALSE'];
    if (!correctAnswer || !validAns.includes(correctAnswer.trim().toUpperCase())) {
      return 'True/False questions require a correctAnswer of "T" or "F".';
    }
  } else if (questionType === 'NUMERICAL') {
    if (numericalAnswer === null || numericalAnswer === undefined || isNaN(Number(numericalAnswer))) {
      return 'Numerical questions require a valid numeric numericalAnswer.';
    }
    if (numericalTolerance !== undefined && (isNaN(Number(numericalTolerance)) || Number(numericalTolerance) < 0)) {
      return 'Numerical tolerance must be a non-negative number.';
    }
  } else if (questionType === 'FILL_BLANK') {
    const answers = Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0
      ? acceptedAnswers
      : (correctAnswer ? [correctAnswer] : []);
    if (answers.length === 0 || answers.every((a) => !String(a).trim())) {
      return 'Fill in the Blank questions require at least one accepted answer string.';
    }
  }

  return null;
};

// @desc    Get questions (Teacher Question Bank / Admin Question Bank)
// @route   GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      questionType,
      status,
      search,
      scope, // 'mine', 'all'
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Teacher ownership scoping
    if (req.user.role === 'TEACHER') {
      if (scope !== 'all') {
        filter.createdBy = req.user._id;
      }
    }

    if (subject && subject !== 'All') {
      filter.subject = subject;
    }

    if (topic && topic !== 'All') {
      filter.topic = topic;
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    if (questionType && questionType !== 'All') {
      filter.questionType = questionType;
    }

    if (status && status !== 'All') {
      filter.status = status;
    } else if (!status) {
      filter.status = { $ne: 'Archived' };
    }

    if (search) {
      filter.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const result = await paginateQuery(Question, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'createdBy', select: 'name email role department' },
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).populate('createdBy', 'name email role department');
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create question
// @route   POST /api/questions
const createQuestion = async (req, res, next) => {
  try {
    const validationError = validateQuestionPayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      questionText,
      questionType = 'SINGLE_MCQ',
      options = [],
      correctAnswer = '',
      correctAnswers = [],
      acceptedAnswers = [],
      numericalAnswer = null,
      numericalTolerance = 0,
      explanation,
      subject,
      topic,
      subtopic = '',
      difficulty = 'Medium',
      marks = 1,
      negativeMarks = 0,
      tags = [],
      estimatedTime = 60,
      status = 'Active',
    } = req.body;

    let finalOptions = options;
    let finalCorrectAnswer = correctAnswer ? correctAnswer.trim().toUpperCase() : '';
    let finalCorrectAnswers = Array.isArray(correctAnswers)
      ? correctAnswers.map((a) => String(a).trim().toUpperCase())
      : [];
    let finalAcceptedAnswers = Array.isArray(acceptedAnswers)
      ? acceptedAnswers.map((a) => String(a).trim()).filter(Boolean)
      : [];

    if (questionType === 'TRUE_FALSE') {
      finalOptions = [
        { id: 'T', text: 'True' },
        { id: 'F', text: 'False' },
      ];
      finalCorrectAnswer = ['TRUE', 'T'].includes(finalCorrectAnswer) ? 'T' : 'F';
    } else if (questionType === 'MULTIPLE_MCQ') {
      if (!finalCorrectAnswer && finalCorrectAnswers.length > 0) {
        finalCorrectAnswer = finalCorrectAnswers[0];
      }
    } else if (questionType === 'FILL_BLANK') {
      if (finalAcceptedAnswers.length === 0 && finalCorrectAnswer) {
        finalAcceptedAnswers = [finalCorrectAnswer];
      }
      if (!finalCorrectAnswer && finalAcceptedAnswers.length > 0) {
        finalCorrectAnswer = finalAcceptedAnswers[0];
      }
    } else if (questionType === 'NUMERICAL') {
      finalCorrectAnswer = String(numericalAnswer);
    }

    const question = await Question.create({
      questionText: questionText.trim(),
      questionType,
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      correctAnswers: finalCorrectAnswers,
      acceptedAnswers: finalAcceptedAnswers,
      numericalAnswer: numericalAnswer !== null && numericalAnswer !== undefined ? Number(numericalAnswer) : null,
      numericalTolerance: Number(numericalTolerance) || 0,
      explanation: explanation.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      subtopic: subtopic.trim(),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      tags: Array.isArray(tags) ? tags : [],
      estimatedTime: Number(estimatedTime) || 60,
      status: ['Active', 'Pending Review', 'Archived'].includes(status) ? status : 'Active',
      version: 1,
      createdBy: req.user._id,
    });

    await logAdminAction({
      action: 'QUESTION_CREATED',
      performedBy: req.user._id,
      entityType: 'QUESTION',
      entityId: question._id,
      details: { subject: question.subject, topic: question.topic, type: question.questionType },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully in Question Bank.',
      data: question,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question (increments version, verifies ownership)
// @route   PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    // Ownership check for TEACHER role
    if (req.user.role === 'TEACHER' && question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only modify questions created by yourself.',
      });
    }

    const validationError = validateQuestionPayload({ ...question.toObject(), ...req.body });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Increment version to preserve immutable audit trail
    req.body.version = (question.version || 1) + 1;
    req.body.updatedBy = req.user._id;

    if (req.body.questionType === 'TRUE_FALSE') {
      req.body.options = [
        { id: 'T', text: 'True' },
        { id: 'F', text: 'False' },
      ];
      if (req.body.correctAnswer) {
        req.body.correctAnswer = ['TRUE', 'T'].includes(req.body.correctAnswer.toUpperCase()) ? 'T' : 'F';
      }
    }

    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAdminAction({
      action: 'QUESTION_UPDATED',
      performedBy: req.user._id,
      entityType: 'QUESTION',
      entityId: updated._id,
      details: { version: updated.version, updatedFields: Object.keys(req.body) },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete question (soft archive or remove)
// @route   DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    if (req.user.role === 'TEACHER' && question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete questions created by yourself.',
      });
    }

    question.status = 'Archived';
    await question.save();

    await logAdminAction({
      action: 'QUESTION_DELETED',
      performedBy: req.user._id,
      entityType: 'QUESTION',
      entityId: question._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Question archived successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Duplicate question
// @route   POST /api/questions/:id/duplicate
const duplicateQuestion = async (req, res, next) => {
  try {
    const original = await Question.findById(req.params.id);
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    const cloneData = original.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.__v;

    cloneData.questionText = `${cloneData.questionText} (Copy)`;
    cloneData.createdBy = req.user._id;
    cloneData.updatedBy = req.user._id;
    cloneData.version = 1;
    cloneData.status = 'Active';

    const clonedQuestion = await Question.create(cloneData);

    res.status(201).json({
      success: true,
      message: 'Question duplicated successfully.',
      data: clonedQuestion,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Archive single question
// @route   PATCH /api/questions/:id/archive
const archiveQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    if (req.user.role === 'TEACHER' && question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. Unauthorized to archive this question.' });
    }

    question.status = 'Archived';
    await question.save();

    res.status(200).json({ success: true, message: 'Question archived successfully.', data: question });
  } catch (err) {
    next(err);
  }
};

// @desc    Restore single question
// @route   PATCH /api/questions/:id/restore
const restoreQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    if (req.user.role === 'TEACHER' && question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. Unauthorized to restore this question.' });
    }

    question.status = 'Active';
    await question.save();

    res.status(200).json({ success: true, message: 'Question restored successfully.', data: question });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk archive questions
// @route   POST /api/questions/bulk-archive
const bulkArchiveQuestions = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'questionIds array is required.' });
    }

    const filter = { _id: { $in: questionIds } };
    if (req.user.role === 'TEACHER') {
      filter.createdBy = req.user._id;
    }

    const result = await Question.updateMany(filter, { $set: { status: 'Archived' } });
    res.status(200).json({
      success: true,
      message: `Archived ${result.modifiedCount} questions.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk restore questions
// @route   POST /api/questions/bulk-restore
const bulkRestoreQuestions = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'questionIds array is required.' });
    }

    const filter = { _id: { $in: questionIds } };
    if (req.user.role === 'TEACHER') {
      filter.createdBy = req.user._id;
    }

    const result = await Question.updateMany(filter, { $set: { status: 'Active' } });
    res.status(200).json({
      success: true,
      message: `Restored ${result.modifiedCount} questions.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk upload questions via CSV
// @route   POST /api/questions/bulk-upload
const bulkUploadQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file.',
      });
    }

    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let rowNumber = 1;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        const qText = row.question || row.questionText;
        const qType = (row.questionType || 'SINGLE_MCQ').trim().toUpperCase();
        const optA = row.optionA;
        const optB = row.optionB;
        const optC = row.optionC;
        const optD = row.optionD;
        const correct = (row.correctAnswer || row.correct || '').trim();
        const expl = row.explanation || 'No explanation provided.';
        const subj = row.subject;
        const top = row.topic;
        const subtopic = row.subtopic || '';
        const diff = row.difficulty || 'Medium';
        const marks = parseFloat(row.marks) || 1;
        const neg = parseFloat(row.negativeMarks) || 0;

        if (!qText || !subj || !top) {
          errors.push({
            row: rowNumber,
            reason: 'Missing required columns (questionText, subject, topic).',
            data: row,
          });
          return;
        }

        if (qType === 'NUMERICAL') {
          const numVal = parseFloat(correct || row.numericalAnswer);
          if (isNaN(numVal)) {
            errors.push({ row: rowNumber, reason: 'Invalid numerical answer.', data: row });
            return;
          }
          results.push({
            questionText: qText.trim(),
            questionType: 'NUMERICAL',
            options: [],
            numericalAnswer: numVal,
            numericalTolerance: parseFloat(row.numericalTolerance) || 0,
            correctAnswer: String(numVal),
            explanation: expl.trim(),
            subject: subj.trim(),
            topic: top.trim(),
            subtopic: subtopic.trim(),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
            marks,
            negativeMarks: neg,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        } else if (qType === 'FILL_BLANK') {
          const accepted = (correct || '').split('|').map((s) => s.trim()).filter(Boolean);
          if (accepted.length === 0) {
            errors.push({ row: rowNumber, reason: 'Fill-blank requires at least 1 answer.', data: row });
            return;
          }
          results.push({
            questionText: qText.trim(),
            questionType: 'FILL_BLANK',
            options: [],
            acceptedAnswers: accepted,
            correctAnswer: accepted[0],
            explanation: expl.trim(),
            subject: subj.trim(),
            topic: top.trim(),
            subtopic: subtopic.trim(),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
            marks,
            negativeMarks: neg,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        } else if (qType === 'TRUE_FALSE') {
          const tfCorrect = ['TRUE', 'T'].includes(correct.toUpperCase()) ? 'T' : 'F';
          results.push({
            questionText: qText.trim(),
            questionType: 'TRUE_FALSE',
            options: [
              { id: 'T', text: 'True' },
              { id: 'F', text: 'False' },
            ],
            correctAnswer: tfCorrect,
            explanation: expl.trim(),
            subject: subj.trim(),
            topic: top.trim(),
            subtopic: subtopic.trim(),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
            marks,
            negativeMarks: neg,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        } else {
          // Standard Single MCQ
          if (!optA || !optB || !correct) {
            errors.push({
              row: rowNumber,
              reason: 'MCQ questions require optionA, optionB, and correctAnswer.',
              data: row,
            });
            return;
          }

          const opts = [
            { id: 'A', text: optA.trim() },
            { id: 'B', text: optB.trim() },
            ...(optC ? [{ id: 'C', text: optC.trim() }] : []),
            ...(optD ? [{ id: 'D', text: optD.trim() }] : []),
          ];

          results.push({
            questionText: qText.trim(),
            questionType: 'SINGLE_MCQ',
            options: opts,
            correctAnswer: correct.toUpperCase(),
            explanation: expl.trim(),
            subject: subj.trim(),
            topic: top.trim(),
            subtopic: subtopic.trim(),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
            marks,
            negativeMarks: neg,
            status: 'Active',
            version: 1,
            createdBy: req.user._id,
          });
        }
      })
      .on('end', async () => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}

        if (results.length > 0) {
          await Question.insertMany(results);
          await logAdminAction({
            action: 'BULK_UPLOAD',
            performedBy: req.user._id,
            entityType: 'QUESTION',
            details: { insertedCount: results.length, errorCount: errors.length },
            req,
          });
        }

        res.status(200).json({
          success: true,
          message: `Bulk upload processed. ${results.length} questions imported, ${errors.length} failed.`,
          successfulRows: results.length,
          failedRows: errors.length,
          errors,
        });
      })
      .on('error', (err) => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  archiveQuestion,
  restoreQuestion,
  bulkArchiveQuestions,
  bulkRestoreQuestions,
  bulkUploadQuestions,
};
