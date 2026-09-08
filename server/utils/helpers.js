/**
 * ExamSphere Query & Data Helper Utilities
 */

const paginateQuery = async (Model, filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 }, populate = null, select = null }) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (currentPage - 1) * currentLimit;

  let query = Model.find(filter).sort(sort).skip(skip).limit(currentLimit);

  if (select) {
    query = query.select(select);
  }

  if (populate) {
    query = query.populate(populate);
  }

  const [docs, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  const totalPages = Math.ceil(total / currentLimit) || 1;

  return {
    docs,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
};

/**
 * Sanitize question for student attempt
 * Strips correctAnswer and explanation; orders options according to frozen optionOrder
 */
const sanitizeQuestionForStudent = (questionSnapshot, optionOrder = null) => {
  let options = questionSnapshot.options;
  if (optionOrder && Array.isArray(optionOrder) && optionOrder.length > 0) {
    const orderMap = new Map(optionOrder.map((id, index) => [id, index]));
    options = [...options].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  }

  return {
    questionId: questionSnapshot.questionId,
    questionText: questionSnapshot.questionText,
    options: options.map((o) => ({ id: o.id, text: o.text })),
    subject: questionSnapshot.subject,
    topic: questionSnapshot.topic,
    difficulty: questionSnapshot.difficulty,
    marks: questionSnapshot.marks,
    negativeMarks: questionSnapshot.negativeMarks,
  };
};

module.exports = {
  paginateQuery,
  sanitizeQuestionForStudent,
};
