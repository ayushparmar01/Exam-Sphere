import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export const ExamDetailsPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/exams/${examId}`);
        if (res.data && res.data.data) {
          setExam(res.data.data);
        }
      } catch (err) {
        setError('Failed to load examination specifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleStartExam = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/exam/${examId}` } } });
      return;
    }

    try {
      setStarting(true);
      setError('');
      setShowStartModal(false);

      const res = await api.post('/attempts/start', { examId });
      if (res.data && res.data.data) {
        const attemptId = res.data.data.attemptId;
        navigate(`/exam/${examId}/attempt/${attemptId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start examination session.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Retrieving exam syllabus and rules...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Exam Not Found</h2>
        <p className="text-xs text-slate-500">The requested assessment could not be located or has been archived.</p>
        <Link to="/exams" className="inline-block text-xs font-bold text-indigo-600 hover:underline">
          Return to Exam Catalog
        </Link>
      </div>
    );
  }

  const attemptInfo = exam.userAttemptInfo || {};
  const isLive = exam.computedStatus === 'LIVE';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back navigation */}
      <Link
        to="/exams"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assessment Catalog
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Strip */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
              {exam.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
              Difficulty: {exam.difficulty}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              Status: {exam.computedStatus}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{exam.title}</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {exam.description || 'Comprehensive multiple-choice assessment designed for realistic certification simulation.'}
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              {exam.duration} mins
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Questions</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {exam.questions?.length || 0}
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Marks</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {exam.totalMarks || 10} pts
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passing Threshold</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {exam.passingPercentage}%
            </span>
          </div>
        </div>

        {/* Instructions Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Examination Rules & Instructions
            </h3>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Server-Authoritative Timing:</strong> The exam clock is governed continuously by the backend server. If the timer reaches zero, your answers will be automatically finalized and submitted.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Answer Persistence:</strong> Every answer selection is auto-saved instantaneously to the database with connection fallback. Refreshing your browser will seamlessly restore your active attempt.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Marking Scheme:</strong> Each correct response awards full marks.{' '}
                  {exam.negativeMarking ? (
                    <span className="text-rose-600 font-bold">
                      Negative marking of {exam.negativeMarkPenalty || 0.25} marks is deducted for each incorrect answer.
                    </span>
                  ) : (
                    <span>There is no penalty for incorrect responses.</span>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Integrity Protocol:</strong> Unfocused windows and tab switching events are audited to ensure fair leaderboard ranking standards.
                </span>
              </div>
            </div>
          </div>

          {/* Attempt Status Banner */}
          {isAuthenticated && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-indigo-950">Your Candidate Attempt Status:</p>
                <p className="text-indigo-700">
                  {attemptInfo.hasActiveSession ? (
                    'You have an in-progress active attempt! Click below to resume.'
                  ) : (
                    `Attempts used: ${attemptInfo.attemptsCount || 0} of ${exam.maximumAttempts || 1}. ${
                      exam.allowRetake ? 'Retakes are permitted.' : 'Single attempt allowed.'
                    }`
                  )}
                </p>
              </div>

              {attemptInfo.hasActiveSession && (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 animate-spin" /> Session Active
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Start Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/exams"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </Link>

            {attemptInfo.hasActiveSession ? (
              <button
                onClick={handleStartExam}
                disabled={starting}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-200 transition flex items-center gap-2"
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Resume Active Exam</span>
              </button>
            ) : (
              <button
                onClick={() => setShowStartModal(true)}
                disabled={starting || !isLive || (attemptInfo.canAttempt === false)}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Exam Environment...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Timed Exam</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showStartModal}
        title="Begin Examination?"
        message={`You are about to start "${exam.title}". The ${exam.duration}-minute server countdown will begin immediately once initialized. Ensure you have a stable connection.`}
        confirmText="Yes, Start Exam"
        cancelText="Review Instructions"
        onConfirm={handleStartExam}
        onCancel={() => setShowStartModal(false)}
        type="info"
      />
    </div>
  );
};
