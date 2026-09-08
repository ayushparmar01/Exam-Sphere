import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  Loader2,
  PlusCircle,
  Shuffle,
  Sparkles,
} from 'lucide-react';

export const AdminCreateExamPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [duration, setDuration] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [difficulty, setDifficulty] = useState('Medium');
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [negativeMarkPenalty, setNegativeMarkPenalty] = useState(0.25);
  const [maximumAttempts, setMaximumAttempts] = useState(2);
  const [allowRetake, setAllowRetake] = useState(true);

  // Result Visibility Settings
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const [showPercentile, setShowPercentile] = useState(true);

  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(false);

  // Proctoring & Integrity Configuration
  const [cameraRequired, setCameraRequired] = useState(false);
  const [cameraMonitoringEnabled, setCameraMonitoringEnabled] = useState(false);
  const [microphoneRequired, setMicrophoneRequired] = useState(false);
  const [microphoneMonitoringEnabled, setMicrophoneMonitoringEnabled] = useState(false);
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [maxFullscreenExits, setMaxFullscreenExits] = useState(3);
  const [autoFlagOnHighRisk, setAutoFlagOnHighRisk] = useState(true);
  const [autoTerminateOnHighRisk, setAutoTerminateOnHighRisk] = useState(false);

  // Question selection from Bank
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBank = async () => {
      try {
        setLoadingQuestions(true);
        const res = await api.get('/questions?limit=100');
        if (res.data && res.data.data) {
          setAvailableQuestions(res.data.data);
          // Default select all questions matching default subject
          const matching = res.data.data.filter((q) => q.subject === 'DSA').map((q) => q._id);
          setSelectedQuestions(matching.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load question bank:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchBank();
  }, []);

  const handleToggleQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const handleAutoSelectSubject = () => {
    const matching = availableQuestions
      .filter((q) => q.subject.toLowerCase() === subject.toLowerCase())
      .map((q) => q._id);
    setSelectedQuestions(matching.slice(0, 10));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !subject) {
      setError('Title and Subject are required.');
      return;
    }

    if (selectedQuestions.length === 0) {
      setError('Please select at least 1 question for the examination.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        description,
        subject,
        duration: Number(duration),
        passingPercentage: Number(passingPercentage),
        difficulty,
        negativeMarking,
        negativeMarkPenalty: Number(negativeMarkPenalty),
        maximumAttempts: Number(maximumAttempts),
        allowRetake,
        showResultImmediately,
        showCorrectAnswers,
        showExplanations,
        showLeaderboard,
        showRank,
        showPercentile,
        randomizeQuestions,
        randomizeOptions,
        cameraRequired,
        cameraMonitoringEnabled: cameraMonitoringEnabled || cameraRequired,
        microphoneRequired,
        microphoneMonitoringEnabled: microphoneMonitoringEnabled || microphoneRequired,
        fullscreenRequired,
        maxFullscreenExits: Number(maxFullscreenExits),
        terminateAfterFullscreenExits: autoTerminateOnHighRisk,
        proctoringConfig: {
          lowRiskThreshold: 15,
          mediumRiskThreshold: 40,
          highRiskThreshold: 60,
          maxTabSwitches: 5,
          autoFlagOnHighRisk,
          autoTerminateOnHighRisk,
        },
        questions: selectedQuestions,
        status: 'LIVE',
      };

      await api.post('/exams', payload);
      navigate('/admin/exams');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/admin/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Author New Examination
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure examination schedule, time constraints, result visibility policies, and question sets.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateExam} className="space-y-8">
        {/* Basic Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Core Assessment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Exam Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Systems & Concurrency Mock"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. DSA, DBMS, OS"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description & Candidate Scope
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of topics and objectives covered in this assessment..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Timers & Marking Parameters */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Duration & Scoring Rules
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Max Retakes
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maximumAttempts}
                onChange={(e) => setMaximumAttempts(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Negative Penalty
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarkPenalty}
                onChange={(e) => setNegativeMarkPenalty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-semibold text-slate-800">Enable Negative Marking Deduction</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={allowRetake}
                onChange={(e) => setAllowRetake(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-semibold text-slate-800">Allow Multiple Retakes by Candidate</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-semibold text-slate-800">Shuffle Question Order for Each Candidate</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="font-semibold text-slate-800">Shuffle Multiple-Choice Option Orders</span>
            </label>
          </div>
        </div>

        {/* Result Visibility Policies */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Candidate Result Visibility Policies
          </h3>
          <p className="text-xs text-slate-500">
            Enforce certification standards: hide solutions or ranks until the official assessment testing window concludes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Show Score Immediately', val: showResultImmediately, set: setShowResultImmediately },
              { label: 'Show Correct Answer Keys', val: showCorrectAnswers, set: setShowCorrectAnswers },
              { label: 'Show Explanations', val: showExplanations, set: setShowExplanations },
              { label: 'Show Exam Leaderboard', val: showLeaderboard, set: setShowLeaderboard },
              { label: 'Display Relative Rank', val: showRank, set: setShowRank },
              { label: 'Display Percentile Metric', val: showPercentile, set: setShowPercentile },
            ].map((policy, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={policy.val}
                  onChange={(e) => policy.set(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">{policy.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Proctoring & Integrity Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Proctoring & Exam Integrity Rules
              </h3>
              <p className="text-xs text-slate-500">
                Configure candidate device verification, audio/video monitoring, and risk scoring policies.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
              Enterprise Proctoring
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={cameraRequired}
                onChange={(e) => {
                  setCameraRequired(e.target.checked);
                  if (e.target.checked) setCameraMonitoringEnabled(true);
                }}
                className="w-4 h-4 rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 block">Require Mandatory Candidate Webcam</span>
                <span className="text-slate-500 text-[11px]">
                  Candidate cannot start exam without granting camera access and passing stream test.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={microphoneRequired}
                onChange={(e) => {
                  setMicrophoneRequired(e.target.checked);
                  if (e.target.checked) setMicrophoneMonitoringEnabled(true);
                }}
                className="w-4 h-4 rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 block">Require Microphone Acoustic Monitoring</span>
                <span className="text-slate-500 text-[11px]">
                  Captures privacy-preserving acoustic energy signals to detect sustained speech.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={fullscreenRequired}
                onChange={(e) => setFullscreenRequired(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 block">Enforce Fullscreen Assessment Mode</span>
                <span className="text-slate-500 text-[11px]">
                  Flags candidate when fullscreen is exited; tracks total exit count.
                </span>
              </div>
            </label>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <label className="font-bold text-slate-900 block">Maximum Allowed Fullscreen Exits</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxFullscreenExits}
                onChange={(e) => setMaxFullscreenExits(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition sm:col-span-2">
              <input
                type="checkbox"
                checked={autoFlagOnHighRisk}
                onChange={(e) => setAutoFlagOnHighRisk(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 block">Auto-Flag High Risk Candidates for Supervisor Review</span>
                <span className="text-slate-500 text-[11px]">
                  Automatically places high-risk attempts in supervisor audit queue (non-destructive, favors human review).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Question Selector from Question Bank */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Select Questions from Repository
              </h3>
              <p className="text-xs text-slate-500">
                Selected: <strong className="text-indigo-600">{selectedQuestions.length}</strong> items
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoSelectSubject}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Auto-Select Top {subject} Items</span>
            </button>
          </div>

          {loadingQuestions ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading Question Bank...</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {availableQuestions.map((q) => {
                const isChecked = selectedQuestions.includes(q._id);
                return (
                  <label
                    key={q._id}
                    className={`p-3.5 flex items-start gap-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                      isChecked ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleQuestion(q._id)}
                      className="w-4 h-4 rounded text-indigo-600 mt-0.5"
                    />
                    <div className="flex-1 space-y-0.5">
                      <p className="font-bold text-slate-900 line-clamp-1">{q.questionText}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <span className="text-indigo-600 font-bold">{q.subject}</span>
                        <span>•</span>
                        <span>{q.topic}</span>
                        <span>•</span>
                        <span>{q.difficulty}</span>
                        <span>•</span>
                        <span>+{q.marks} pts</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/admin/exams"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            <span>Publish Assessment to Catalog</span>
          </button>
        </div>
      </form>
    </div>
  );
};
