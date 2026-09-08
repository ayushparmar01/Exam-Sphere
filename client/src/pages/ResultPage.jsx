import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  ArrowRight,
  Loader2,
  Share2,
} from 'lucide-react';

export const ResultPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED'

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/results/${attemptId}`);
        if (res.data && res.data.data) {
          setResult(res.data.data);
          // If passed, fire victory confetti
          if (res.data.data.isPassed) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        }
      } catch (err) {
        setError('Failed to load assessment result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/results/${attemptId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ExamSphere_Report_${attemptId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Unable to download PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Calculating Certified Assessment Result...</h2>
        <p className="text-xs text-slate-500">Evaluating answers against server-side answer keys and computing rankings.</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Result Unavailable</h3>
        <p className="text-xs text-slate-500">{error || 'The requested result could not be retrieved.'}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const timeMins = Math.floor(result.timeTakenSeconds / 60);
  const timeSecs = result.timeTakenSeconds % 60;
  const filteredQuestions = (result.questionReview || []).filter((q) => {
    if (filterStatus === 'CORRECT') return q.isCorrect;
    if (filterStatus === 'INCORRECT') return !q.isCorrect && q.selectedOption;
    if (filterStatus === 'UNATTEMPTED') return !q.selectedOption;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Result Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                Official Result
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Attempt ID: {attemptId.slice(-8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {result.examId?.title || 'Assessment'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Completed on {new Date(result.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Download PDF & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition flex items-center gap-2"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF Report</span>
            </button>

            <Link
              to={`/leaderboard/${result.examId?._id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
          {/* Final Score */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Score</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">
              {result.score}/{result.totalMarks}
            </p>
            <span className="text-xs font-semibold text-slate-600 block mt-0.5">
              {result.percentage}% Marks
            </span>
          </div>

          {/* Pass / Fail Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
            <p
              className={`text-xl font-extrabold mt-1.5 ${
                result.isPassed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {result.isPassed ? 'PASSED' : 'NOT PASSED'}
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Pass Mark: {result.passingPercentage}%
            </span>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{result.accuracy}%</p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {result.correctCount} Correct / {result.totalQuestions}
            </span>
          </div>

          {/* Dynamic Rank */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Rank</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {result.rank ? `#${result.rank}` : 'N/A'}
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              of {result.totalParticipants || 1} candidates
            </span>
          </div>

          {/* Percentile */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentile</span>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {result.percentile !== null ? `${result.percentile}%` : 'N/A'}
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Beat {result.percentile || 0}% peers
            </span>
          </div>

          {/* Time Taken */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Taken</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {timeMins}m {timeSecs}s
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Avg {Math.round(result.timeTakenSeconds / (result.totalQuestions || 1))}s / question
            </span>
          </div>
        </div>
      </div>

      {/* AI / Rule-Based Recommendations Box */}
      {result.aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Personalized Performance Insights & Study Plan</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {result.aiAnalysis.mode === 'GEMINI' ? 'Gemini AI Mode' : 'Rule-Based Engine'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {result.aiAnalysis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
              </h4>
              <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                {result.aiAnalysis.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Study Plan */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" /> Recommended Next Steps
              </h4>
              <ul className="text-xs text-indigo-950 space-y-1 list-disc list-inside">
                {result.aiAnalysis.studyPlan?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Question Review Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detailed Question-by-Question Review</h3>
            <p className="text-xs text-slate-500">Analyze choices, correct answers, and detailed pedagogical explanations.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: `All (${result.totalQuestions})` },
              { id: 'CORRECT', label: `Correct (${result.correctCount})` },
              { id: 'INCORRECT', label: `Incorrect (${result.incorrectCount})` },
              { id: 'UNATTEMPTED', label: `Skipped (${result.unattemptedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const isAnswered = !!q.selectedOption;
            const isCorrect = q.isCorrect;

            return (
              <div
                key={q.questionId || idx}
                className={`p-5 sm:p-6 rounded-2xl border-2 transition ${
                  !isAnswered
                    ? 'border-slate-200 bg-slate-50/50'
                    : isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between text-xs pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Question {idx + 1}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{q.topic || 'General'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{q.difficulty}</span>
                  </div>

                  <div>
                    {!isAnswered ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        Unattempted (0 pts)
                      </span>
                    ) : isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Correct (+{q.marksAwarded} pts)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Incorrect ({q.marksAwarded} pts)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 leading-relaxed">
                  {q.questionText}
                </h4>

                {/* Options Review */}
                <div className="space-y-2 mb-4">
                  {q.options?.map((opt) => {
                    const isCandidateChoice = q.selectedOption === opt.id;
                    const isCorrectAnswer = q.correctAnswer === opt.id;

                    let optClass = 'border-slate-200 bg-white text-slate-700';
                    if (isCorrectAnswer) {
                      optClass = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold';
                    } else if (isCandidateChoice && !isCorrect) {
                      optClass = 'border-rose-400 bg-rose-50 text-rose-950';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optClass}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCorrectAnswer
                                ? 'bg-emerald-600 text-white'
                                : isCandidateChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          {isCandidateChoice && (
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Your Choice
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Explanation:
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer Action */}
      <div className="flex justify-between items-center pt-4">
        <Link
          to="/mistakes"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View All Historical Mistakes →
        </Link>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
