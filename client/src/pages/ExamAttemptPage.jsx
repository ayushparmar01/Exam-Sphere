import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../hooks/useTimer';
import { useExamIntegrity } from '../hooks/useExamIntegrity';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { ExamTimer } from '../components/ExamTimer';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator';
import { QuestionPalette } from '../components/QuestionPalette';
import { ConfirmModal } from '../components/ConfirmModal';
import ExamEnvironmentCheckModal from '../components/ExamEnvironmentCheckModal';
import ProctoringWebcam from '../components/ProctoringWebcam';
import IntegrityWarningBanner from '../components/IntegrityWarningBanner';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  HelpCircle,
  Loader2,
  Send,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const ExamAttemptPage = () => {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]); // [{ questionId, selectedOption, visited, markedForReview }]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [serverRemainingSeconds, setServerRemainingSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'offline' | 'synced'
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Environment Readiness Check Gate
  const [envCheckPassed, setEnvCheckPassed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Offline Answer Queue Hook
  const {
    isOnline,
    syncStatus,
    pendingCount,
    syncMessage,
    enqueueAnswer,
    flushQueue,
  } = useOfflineQueue(attemptId);

  // Integrity hook
  const {
    warningCount,
    riskScore,
    riskLevel,
    showWarningModal,
    dismissWarning,
    lastWarningMessage,
    sendEvent,
  } = useExamIntegrity(attemptId, !loading && !submitting && envCheckPassed);

  // Auto-submit callback when timer hits 0
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await api.post(`/attempts/${attemptId}/submit`, {
        timeSpentSeconds: exam?.duration ? exam.duration * 60 : 1800,
        submissionId: `auto_${Date.now()}`,
      });
      navigate(`/results/${attemptId}`, { replace: true });
    } catch (err) {
      console.error('Auto-submit failed:', err);
      navigate(`/results/${attemptId}`, { replace: true });
    }
  }, [attemptId, exam, submitting, navigate]);

  // Countdown timer hook
  const { remainingSeconds, formatted, isUrgent } = useTimer(
    serverRemainingSeconds,
    handleAutoSubmit
  );

  // Fullscreen helper
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Load Session and Questions
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/attempts/${attemptId}/session`);
        if (res.data && res.data.data) {
          const d = res.data.data;
          setExam(d.exam);
          setQuestions(d.questions);
          setAnswers(d.answers || []);
          setCurrentIndex(d.currentQuestionIndex || 0);
          setServerRemainingSeconds(d.remainingSeconds);

          // If exam doesn't require camera/mic/fullscreen, auto-pass check
          if (
            !d.exam?.cameraRequired &&
            !d.exam?.microphoneRequired &&
            !d.exam?.fullscreenRequired
          ) {
            setEnvCheckPassed(true);
          }

          if (d.status === 'SUBMITTED' || d.status === 'TIMED_OUT') {
            navigate(`/results/${attemptId}`, { replace: true });
          }
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Failed to load examination attempt.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [attemptId, navigate]);

  // Option selection handler with Offline Queue Integration
  const handleSelectOption = (optionId) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers.find((a) => a.questionId === currentQ.questionId);
    const newSelected = existingAns?.selectedOption === optionId ? null : optionId;

    const updatedAnswers = answers.map((ans) => {
      if (ans.questionId === currentQ.questionId) {
        return {
          ...ans,
          selectedOption: newSelected,
          visited: true,
          savedAt: new Date(),
        };
      }
      return ans;
    });

    setAnswers(updatedAnswers);
    setSaveStatus('saving');

    // Enqueue through offline-resilient hook
    enqueueAnswer({
      questionId: currentQ.questionId,
      selectedOption: newSelected,
      markedForReview: existingAns?.markedForReview || false,
      visited: true,
      currentQuestionIndex: currentIndex,
    }).then(() => {
      setSaveStatus(isOnline ? 'saved' : 'offline');
    });
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers.find((a) => a.questionId === currentQ.questionId);
    const newMarked = !existingAns?.markedForReview;

    const updatedAnswers = answers.map((ans) => {
      if (ans.questionId === currentQ.questionId) {
        return {
          ...ans,
          markedForReview: newMarked,
          visited: true,
        };
      }
      return ans;
    });

    setAnswers(updatedAnswers);
    setSaveStatus('saving');

    enqueueAnswer({
      questionId: currentQ.questionId,
      selectedOption: existingAns?.selectedOption || null,
      markedForReview: newMarked,
      visited: true,
      currentQuestionIndex: currentIndex,
    }).then(() => {
      setSaveStatus(isOnline ? 'saved' : 'offline');
    });
  };

  // Clear Choice
  const handleClearChoice = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existingAns = answers.find((a) => a.questionId === currentQ.questionId);
    const updatedAnswers = answers.map((ans) => {
      if (ans.questionId === currentQ.questionId) {
        return {
          ...ans,
          selectedOption: null,
          visited: true,
        };
      }
      return ans;
    });

    setAnswers(updatedAnswers);
    setSaveStatus('saving');

    enqueueAnswer({
      questionId: currentQ.questionId,
      selectedOption: null,
      markedForReview: existingAns?.markedForReview || false,
      visited: true,
      currentQuestionIndex: currentIndex,
    }).then(() => {
      setSaveStatus(isOnline ? 'saved' : 'offline');
    });
  };

  // Navigate Questions
  const handleJumpToIndex = (newIndex) => {
    if (newIndex >= 0 && newIndex < questions.length) {
      const targetQ = questions[newIndex];
      setAnswers((prev) =>
        prev.map((ans) => (ans.questionId === targetQ.questionId ? { ...ans, visited: true } : ans))
      );
      setCurrentIndex(newIndex);
    }
  };

  // Manual Submission Confirmation
  const handleManualSubmit = async () => {
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      // Flush any queued offline answers before submitting
      await flushQueue();

      const timeSpent = exam?.duration ? Math.max(0, exam.duration * 60 - remainingSeconds) : 0;
      await api.post(`/attempts/${attemptId}/submit`, {
        timeSpentSeconds: timeSpent,
        submissionId: `client_${Date.now()}`,
      });

      navigate(`/results/${attemptId}`, { replace: true });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Submission error. Please retry.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">
          Initializing Secure Assessment Environment...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Assessment Notice</h2>
          <p className="text-sm text-slate-400">{errorMessage}</p>
          <button
            onClick={() => navigate('/exams')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
          >
            Return to Exam Catalog
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQ?.questionId) || {};
  const answeredCount = answers.filter((a) => a.selectedOption !== null).length;
  const markedCount = answers.filter((a) => a.markedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Pre-Exam Environment Readiness Check Modal */}
      <ExamEnvironmentCheckModal
        isOpen={!envCheckPassed}
        examConfig={exam || {}}
        onPass={() => {
          setEnvCheckPassed(true);
          if (exam?.fullscreenRequired) {
            enterFullscreen();
          }
        }}
        onCancel={() => navigate('/exams')}
      />

      {/* Floating Proctoring Webcam Widget */}
      {envCheckPassed && (
        <ProctoringWebcam
          cameraActive={!!(exam?.cameraRequired || exam?.cameraMonitoringEnabled)}
          micActive={!!(exam?.microphoneRequired || exam?.microphoneMonitoringEnabled)}
          fullscreenActive={isFullscreen}
          onStreamStopped={() => sendEvent('CAMERA_STREAM_STOPPED', {})}
          onCameraError={() => sendEvent('CAMERA_UNAVAILABLE', {})}
          onMicError={() => sendEvent('MICROPHONE_UNAVAILABLE', {})}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
              ES
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight line-clamp-1">{exam?.title}</h1>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span>{exam?.subject}</span>
                <span>•</span>
                <span>{questions.length} Questions</span>
                <span>•</span>
                <span>{exam?.totalMarks} Marks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* AutoSave and Offline Sync Status */}
            <div className="hidden sm:flex items-center gap-2">
              {!isOnline ? (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 font-medium">
                  <WifiOff className="w-3.5 h-3.5" /> Offline ({pendingCount} pending)
                </span>
              ) : (
                <AutoSaveIndicator status={saveStatus} />
              )}
            </div>

            {/* Authoritative Server Countdown Timer */}
            <ExamTimer
              remainingSeconds={remainingSeconds}
              formatted={formatted}
              isUrgent={isUrgent}
            />

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Network / Sync Banner if offline or syncing */}
      {syncMessage && (
        <div
          className={`px-4 py-2 text-center text-xs font-semibold transition ${
            !isOnline
              ? 'bg-amber-600 text-white'
              : syncStatus === 'SYNCING'
              ? 'bg-indigo-600 text-white animate-pulse'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {syncMessage}
        </div>
      )}

      {/* Main Examination Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Area (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Integrity Warning Banner (if risk detected) */}
          <IntegrityWarningBanner
            riskLevel={riskLevel}
            riskScore={riskScore}
            onDismiss={dismissWarning}
          />

          {/* Question Meta Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">{currentQ?.topic}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                +{currentQ?.marks || 1}
              </span>
              {exam?.negativeMarking && (
                <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
                  -{currentQ?.negativeMarks || 0.25}
                </span>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="flex-1 space-y-6">
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed select-none">
              {currentQ?.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ?.options?.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 select-none ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-normal flex-1">
                      {opt.text}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Bottom Controls */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReview}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  currentAnswer.markedForReview
                    ? 'bg-purple-50 text-purple-700 border-purple-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{currentAnswer.markedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {currentAnswer.selectedOption && (
                <button
                  onClick={handleClearChoice}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJumpToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => handleJumpToIndex(currentIndex + 1)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <span>Finish & Submit</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (4 Cols) */}
        <div className="lg:col-span-4">
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelectIndex={handleJumpToIndex}
          />
        </div>
      </main>

      {/* Submission Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        title="Finalize & Submit Exam?"
        message="Once submitted, your answers will be evaluated server-side and your final score calculated. You will not be able to change answers."
        confirmText="Yes, Submit Now"
        cancelText="Review Questions"
        onConfirm={handleManualSubmit}
        onCancel={() => setShowSubmitModal(false)}
        type={unansweredCount > 0 ? 'warning' : 'info'}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        totalQuestions={questions.length}
      />

      {/* Integrity Warning Alert Modal */}
      {showWarningModal && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500 flex items-start gap-3 animate-slideUp">
          <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-400">Exam Integrity Warning ({warningCount})</h4>
            <p className="text-[11px] text-slate-300 leading-snug">{lastWarningMessage}</p>
            <button
              onClick={dismissWarning}
              className="mt-1 text-[11px] font-bold text-amber-300 hover:underline"
            >
              Acknowledge & Continue Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
