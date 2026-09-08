const Question = require('../models/Question');
const { paginateQuery } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');
const fs = require('fs');
const csv = require('csv-parser');

// @desc    Get questions (Admin Question Bank)
// @route   GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (subject && subject !== 'All') {
      filter.subject = subject;
    }

    if (topic && topic !== 'All') {
      filter.topic = topic;
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    if (status && status !== 'All') {
      filter.status = status;
    } else {
      filter.status = { $ne: 'Archived' };
    }

    if (search) {
      filter.questionText = { $regex: search, $options: 'i' };
    }

    const result = await paginateQuery(Question, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'createdBy', select: 'name email' },
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
    const question = await Question.findById(req.params.id).populate('createdBy', 'name email');
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
    const {
      questionText,
      options,
      correctAnswer,
      explanation,
      subject,
      topic,
      difficulty,
      marks,
      negativeMarks,
      tags,
      status,
    } = req.body;

    if (!questionText || !options || !correctAnswer || !explanation || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Question text, 4 options, correct answer, explanation, subject, and topic are required.',
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Questions must have at least 2 options.',
      });
    }

    const question = await Question.create({
      questionText: questionText.trim(),
      options,
      correctAnswer: correctAnswer.trim().toUpperCase(),
      explanation: explanation.trim(),
      subject: subject.trim(),
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      marks: marks ? Number(marks) : 1,
      negativeMarks: negativeMarks ? Number(negativeMarks) : 0,
      tags: tags || [],
      status: status || 'Active',
      version: 1,
      createdBy: req.user._id,
    });

    await logAdminAction({
      action: 'QUESTION_CREATED',
      performedBy: req.user._id,
      entityType: 'QUESTION',
      entityId: question._id,
      details: { subject: question.subject, topic: question.topic },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully.',
      data: question,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question (increments version)
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

    // Increment version to preserve snapshot integrity
    req.body.version = (question.version || 1) + 1;

    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAdminAction({
      action: 'QUESTION_UPDATED',
      performedBy: req.user._id,
      entityType: 'QUESTION',
      entityId: updated._id,
      details: { version: updated.version },
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
    let rowNumber = 1; // 1 is header

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        const qText = row.question || row.questionText;
        const optA = row.optionA;
        const optB = row.optionB;
        const optC = row.optionC;
        const optD = row.optionD;
        const correct = (row.correctAnswer || row.correct || '').trim().toUpperCase();
        const expl = row.explanation;
        const subj = row.subject;
        const top = row.topic;
        const diff = row.difficulty || 'Medium';
        const marks = parseFloat(row.marks) || 1;
        const neg = parseFloat(row.negativeMarks) || 0;

        if (!qText || !optA || !optB || !optC || !optD || !correct || !expl || !subj || !top) {
          errors.push({
            row: rowNumber,
            reason: 'Missing required columns (question, optionA-D, correctAnswer, explanation, subject, topic).',
            data: row,
          });
          return;
        }

        if (!['A', 'B', 'C', 'D'].includes(correct)) {
          errors.push({
            row: rowNumber,
            reason: `Invalid correctAnswer "${correct}". Must be A, B, C, or D.`,
            data: row,
          });
          return;
        }

        results.push({
          questionText: qText.trim(),
          options: [
            { id: 'A', text: optA.trim() },
            { id: 'B', text: optB.trim() },
            { id: 'C', text: optC.trim() },
            { id: 'D', text: optD.trim() },
          ],
          correctAnswer: correct,
          explanation: expl.trim(),
          subject: subj.trim(),
          topic: top.trim(),
          difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
          marks,
          negativeMarks: neg,
          status: 'Active',
          version: 1,
          createdBy: req.user._id,
        });
      })
      .on('end', async () => {
        // Cleanup uploaded temp file
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
  bulkUploadQuestions,
};
