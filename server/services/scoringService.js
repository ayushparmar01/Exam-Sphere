/**
 * Scoring Service
 * Evaluates student answers securely on the server against frozen question snapshots.
 */
const calculateResultData = ({ attempt, exam }) => {
  const snapshots = attempt.questionSnapshots;
  const studentAnswersMap = new Map();

  // Index student's submitted answers
  attempt.answers.forEach((ans) => {
    studentAnswersMap.set(ans.questionId, ans);
  });

  let totalMarks = 0;
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const subjectStats = {};
  const topicStats = {};
  const questionReview = [];

  snapshots.forEach((q) => {
    const marks = q.marks || 1;
    const negativeMarks = q.negativeMarks || 0;
    totalMarks += marks;

    const studentAns = studentAnswersMap.get(q.questionId) || {};
    const selectedOption = studentAns.selectedOption || null;
    const selectedOptions = Array.isArray(studentAns.selectedOptions) ? studentAns.selectedOptions : [];
    const numericalValue = typeof studentAns.numericalValue === 'number' && !isNaN(studentAns.numericalValue) ? studentAns.numericalValue : null;
    const textAnswer = typeof studentAns.textAnswer === 'string' ? studentAns.textAnswer.trim() : null;

    let isUnattempted = true;
    let isCorrect = false;
    const qType = q.questionType || 'SINGLE_MCQ';

    if (qType === 'MULTIPLE_MCQ') {
      isUnattempted = selectedOptions.length === 0;
      if (!isUnattempted) {
        const correctSet = new Set((q.correctAnswers || []).map((a) => String(a).trim().toUpperCase()));
        const studentSet = new Set(selectedOptions.map((a) => String(a).trim().toUpperCase()));
        if (correctSet.size > 0 && correctSet.size === studentSet.size) {
          isCorrect = [...studentSet].every((val) => correctSet.has(val));
        }
      }
    } else if (qType === 'NUMERICAL') {
      isUnattempted = numericalValue === null;
      if (!isUnattempted) {
        const target = Number(q.numericalAnswer);
        const tolerance = Math.max(0, Number(q.numericalTolerance) || 0);
        isCorrect = Math.abs(numericalValue - target) <= tolerance;
      }
    } else if (qType === 'FILL_BLANK') {
      isUnattempted = !textAnswer || textAnswer.length === 0;
      if (!isUnattempted) {
        const normalizedStudent = textAnswer.toLowerCase();
        const validList = [
          ...(q.acceptedAnswers || []).map((a) => String(a).trim().toLowerCase()),
          String(q.correctAnswer || '').trim().toLowerCase(),
        ].filter(Boolean);
        isCorrect = validList.includes(normalizedStudent);
      }
    } else {
      // SINGLE_MCQ or TRUE_FALSE
      isUnattempted = !selectedOption;
      if (!isUnattempted) {
        isCorrect = String(selectedOption).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
      }
    }

    const isIncorrect = !isUnattempted && !isCorrect;

    let marksAwarded = 0;
    if (isCorrect) {
      correctCount++;
      marksAwarded = marks;
      score += marks;
    } else if (isIncorrect) {
      incorrectCount++;
      marksAwarded = -negativeMarks;
      score -= negativeMarks;
    } else {
      unattemptedCount++;
      marksAwarded = 0;
    }

    // Accumulate subject metrics
    const subj = q.subject || 'General';
    if (!subjectStats[subj]) {
      subjectStats[subj] = { subject: subj, totalQuestions: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0 };
    }
    subjectStats[subj].totalQuestions++;
    subjectStats[subj].score += marksAwarded;
    if (isCorrect) subjectStats[subj].correct++;
    else if (isIncorrect) subjectStats[subj].incorrect++;
    else subjectStats[subj].unattempted++;

    // Accumulate topic metrics
    const top = q.topic || 'General';
    if (!topicStats[top]) {
      topicStats[top] = { topic: top, subject: subj, totalQuestions: 0, correct: 0, incorrect: 0, unattempted: 0 };
    }
    topicStats[top].totalQuestions++;
    if (isCorrect) topicStats[top].correct++;
    else if (isIncorrect) topicStats[top].incorrect++;
    else topicStats[top].unattempted++;

    questionReview.push({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: qType,
      options: q.options,
      selectedOption,
      selectedOptions,
      numericalValue,
      textAnswer,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      acceptedAnswers: q.acceptedAnswers,
      numericalAnswer: q.numericalAnswer,
      numericalTolerance: q.numericalTolerance,
      isCorrect,
      marksAwarded,
      explanation: q.explanation,
      subject: subj,
      topic: top,
      difficulty: q.difficulty || 'Medium',
    });
  });

  // Normalize negative total score to 0 floor if required, or keep raw
  const finalScore = Math.max(0, Math.round(score * 100) / 100);
  const percentage = totalMarks > 0 ? Math.max(0, Math.round((finalScore / totalMarks) * 100 * 100) / 100) : 0;
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100 * 100) / 100 : 0;
  const passingPercentage = exam.passingPercentage || 40;
  const isPassed = percentage >= passingPercentage;

  // Calculate subject accuracies
  const subjectPerformance = Object.values(subjectStats).map((s) => {
    const attempted = s.correct + s.incorrect;
    return {
      ...s,
      accuracy: attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0,
    };
  });

  // Calculate topic accuracies
  const topicPerformance = Object.values(topicStats).map((t) => {
    const attempted = t.correct + t.incorrect;
    return {
      ...t,
      accuracy: attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0,
    };
  });

  // Compute time taken in seconds
  const startedAt = new Date(attempt.startedAt);
  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : new Date();
  const timeTakenSeconds = Math.max(0, Math.floor((submittedAt - startedAt) / 1000));

  return {
    score: finalScore,
    percentage,
    accuracy,
    totalMarks,
    passingPercentage,
    isPassed,
    correctCount,
    incorrectCount,
    unattemptedCount,
    totalQuestions: snapshots.length,
    timeTakenSeconds,
    subjectPerformance,
    topicPerformance,
    questionReview,
  };
};

module.exports = { calculateResultData };
