const { generateQuestions } = require('../services/aiService');
const Question = require('../models/Question');
const { logAdminAction } = require('../services/auditService');

// @desc    Generate questions (Gemini Mode or Rule-Based Engine)
// @route   POST /api/ai/generate-questions
const generateQuestionsHandler = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, count, autoSave } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Subject and topic are required.',
      });
    }

    const { mode, questions } = await generateQuestions({
      subject,
      topic,
      difficulty: difficulty || 'Medium',
      count: count || 3,
    });

    let savedQuestions = [];
    if (autoSave && questions.length > 0) {
      const docsToInsert = questions.map((q) => ({
        ...q,
        status: 'Pending Review',
        createdBy: req.user._id,
      }));
      savedQuestions = await Question.insertMany(docsToInsert);

      await logAdminAction({
        action: 'QUESTION_CREATED',
        performedBy: req.user._id,
        entityType: 'QUESTION',
        details: { count: savedQuestions.length, mode },
        req,
      });
    }

    res.status(200).json({
      success: true,
      mode,
      modeLabel: mode === 'GEMINI' ? 'Gemini AI Engine' : 'Rule-Based Recommendation Engine',
      count: questions.length,
      data: savedQuestions.length > 0 ? savedQuestions : questions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve Pending Review questions (Admin)
// @route   PATCH /api/ai/approve-questions
const approveQuestions = async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'questionIds array is required.',
      });
    }

    await Question.updateMany(
      { _id: { $in: questionIds } },
      { $set: { status: 'Active' } }
    );

    res.status(200).json({
      success: true,
      message: `${questionIds.length} questions approved and moved to Active Question Bank.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateQuestionsHandler,
  approveQuestions,
};
