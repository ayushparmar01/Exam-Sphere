import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Shield,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  Lock,
  Plus,
  PlusCircle,
  Save,
  Search,
  Settings,
  Trash2,
  Video,
  Mic,
  Maximize,
  AlertCircle,
  AlertTriangle,
  Send,
  Eye,
  X,
  FileCheck,
} from 'lucide-react';

export const TeacherCreateExamPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Available Bank Questions for Selection
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubject, setBankSubject] = useState('All');

  // Inline Quick Question Creator Modal
  const [inlineModalOpen, setInlineModalOpen] = useState(false);
  const [inlineData, setInlineData] = useState({
    questionText: '',
    questionType: 'SINGLE_MCQ',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
    correctAnswers: ['A'],
    numericalAnswer: '',
    numericalTolerance: 0,
    acceptedAnswersText: '',
    explanation: '',
    subject: 'DSA',
    topic: 'General',
    difficulty: 'Medium',
    marks: 1,
    negativeMarks: 0.25,
  });

  // Main Exam Configuration State
  const [formData, setFormData] = useState({
    // Step 1: Details
    title: '',
    description: '',
    subject: 'DSA',
    duration: 45,
    passingPercentage: 50,
    totalMarks: 0,
    startTime: '',
    endTime: '',
    allowRetake: false,
    maximumAttempts: 1,

    // Step 2: Questions
    questions: [], // array of question IDs
    selectedQuestionsList: [], // full objects for preview & mark calculation
    randomizeQuestions: true,
    randomizeOptions: false,

    // Step 3: Rules
    negativeMarking: false,
    negativeMarkPenalty: 0.25,
    showResultImmediately: true,
    showCorrectAnswers: true,
    showExplanations: true,
    showLeaderboard: true,
    showPercentile: true,

    // Step 4: Proctoring
    cameraRequired: true,
    cameraMonitoringEnabled: true,
    microphoneRequired: true,
    microphoneMonitoringEnabled: true,
    fullscreenRequired: true,
    maxFullscreenExits: 3,
    terminateAfterFullscreenExits: false,
  });

  const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'AI Fundamentals', 'Mathematics', 'Software Engineering'];

  // Load Bank Questions for Step 2
  useEffect(() => {
    if (currentStep === 2) {
      fetchBankQuestions();
    }
  }, [currentStep, bankSubject]);

  const fetchBankQuestions = async () => {
    try {
      setBankLoading(true);
      const params = new URLSearchParams();
      if (bankSubject !== 'All') params.append('subject', bankSubject);
      params.append('limit', 50);
      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data && res.data.data) {
        setBankQuestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setBankLoading(false);
    }
  };

  // Toggle Question Selection
  const toggleSelectQuestion = (q) => {
    const exists = formData.questions.includes(q._id);
    let updatedIds;
    let updatedList;

    if (exists) {
      updatedIds = formData.questions.filter((id) => id !== q._id);
      updatedList = formData.selectedQuestionsList.filter((item) => item._id !== q._id);
    } else {
      updatedIds = [...formData.questions, q._id];
      updatedList = [...formData.selectedQuestionsList, q];
    }

    const calculatedTotalMarks = updatedList.reduce((sum, item) => sum + (item.marks || 1), 0);

    setFormData({
      ...formData,
      questions: updatedIds,
      selectedQuestionsList: updatedList,
      totalMarks: calculatedTotalMarks,
    });
  };

  // Save Inline Question and auto-select it
  const handleSaveInlineQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        questionText: inlineData.questionText,
        questionType: inlineData.questionType,
        subject: inlineData.subject || formData.subject,
        topic: inlineData.topic,
        difficulty: inlineData.difficulty,
        marks: Number(inlineData.marks) || 1,
        negativeMarks: Number(inlineData.negativeMarks) || 0,
        explanation: inlineData.explanation,
      };

      if (inlineData.questionType === 'SINGLE_MCQ') {
        payload.options = inlineData.options.map((o) => ({ id: o.id.trim(), text: o.text.trim() }));
        payload.correctAnswer = inlineData.correctAnswer.trim().toUpperCase();
      } else if (inlineData.questionType === 'MULTIPLE_MCQ') {
        payload.options = inlineData.options.map((o) => ({ id: o.id.trim(), text: o.text.trim() }));
        payload.correctAnswers = inlineData.correctAnswers;
      } else if (inlineData.questionType === 'TRUE_FALSE') {
        payload.options = [
          { id: 'T', text: 'True' },
          { id: 'F', text: 'False' },
        ];
        payload.correctAnswer = inlineData.correctAnswer === 'F' ? 'F' : 'T';
      } else if (inlineData.questionType === 'NUMERICAL') {
        payload.numericalAnswer = Number(inlineData.numericalAnswer);
        payload.numericalTolerance = Number(inlineData.numericalTolerance) || 0;
      } else if (inlineData.questionType === 'FILL_BLANK') {
        payload.acceptedAnswers = inlineData.acceptedAnswersText.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await api.post('/questions', payload);
      if (res.data && res.data.data) {
        const newQ = res.data.data;
        toggleSelectQuestion(newQ);
        setBankQuestions((prev) => [newQ, ...prev]);
        setInlineModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create inline question.');
    }
  };

  // Step 6: Submit Exam (Draft / Scheduled / Published)
  const handleFinalizeExam = async (statusChoice = 'PUBLISHED') => {
    try {
      setSaving(true);
      setErrorMessage('');

      if (!formData.title.trim()) {
        setErrorMessage('Exam title is required.');
        setCurrentStep(1);
        setSaving(false);
        return;
      }

      if (formData.questions.length === 0) {
        setErrorMessage('You must select at least 1 question for the examination.');
        setCurrentStep(2);
        setSaving(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        duration: Number(formData.duration),
        passingPercentage: Number(formData.passingPercentage),
        totalMarks: Number(formData.totalMarks) || formData.questions.length,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        allowRetake: formData.allowRetake,
        maximumAttempts: Number(formData.maximumAttempts) || 1,
        questions: formData.questions,
        randomizeQuestions: formData.randomizeQuestions,
        randomizeOptions: formData.randomizeOptions,
        negativeMarking: formData.negativeMarking,
        negativeMarkPenalty: Number(formData.negativeMarkPenalty) || 0.25,
        showResultImmediately: formData.showResultImmediately,
        showCorrectAnswers: formData.showCorrectAnswers,
        showExplanations: formData.showExplanations,
        showLeaderboard: formData.showLeaderboard,
        showPercentile: formData.showPercentile,
        cameraRequired: formData.cameraRequired,
        cameraMonitoringEnabled: formData.cameraMonitoringEnabled,
        microphoneRequired: formData.microphoneRequired,
        microphoneMonitoringEnabled: formData.microphoneMonitoringEnabled,
        fullscreenRequired: formData.fullscreenRequired,
        maxFullscreenExits: Number(formData.maxFullscreenExits) || 3,
        terminateAfterFullscreenExits: formData.terminateAfterFullscreenExits,
        status: statusChoice,
      };

      const res = await api.post('/exams', payload);
      if (res.data?.success) {
        navigate('/teacher/exams');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create examination.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, name: 'Exam Details' },
    { num: 2, name: 'Select Questions' },
    { num: 3, name: 'Scoring Rules' },
    { num: 4, name: 'Proctoring' },
    { num: 5, name: 'Review Snapshot' },
    { num: 6, name: 'Publish' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            <span>Faculty Examination Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build certification-grade examinations with immutable snapshots and automated proctoring.
          </p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {steps.map((s, idx) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => setCurrentStep(s.num)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-2'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-indigo-600 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: EXAM DETAILS */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 1: Examination Overview & Basic Information
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Examination Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm Examination: Distributed Systems & Algorithms"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description & Candidate Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Provide student guidelines, syllabus coverage, and instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Passing Percentage (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passingPercentage}
                  onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Start Window (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  End Window (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowRetake}
                  onChange={(e) => setFormData({ ...formData, allowRetake: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-700">Allow Multiple Attempts</span>
              </label>

              {formData.allowRetake && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Max Attempts:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maximumAttempts}
                    onChange={(e) => setFormData({ ...formData, maximumAttempts: e.target.value })}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT QUESTIONS */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Step 2: Question Selection & Authoring
              </h3>
              <p className="text-xs text-slate-500">
                Selected: <span className="font-bold text-indigo-600">{formData.questions.length} questions</span> ({formData.totalMarks} Total Marks)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInlineModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Inline Question</span>
              </button>
            </div>
          </div>

          {/* Search & Subject Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter questions..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <div>
              <select
                value={bankSubject}
                onChange={(e) => setBankSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
              >
                <option value="All">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions Bank List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100">
            {bankLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading question bank...</div>
            ) : bankQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No questions found in bank. Click "Create Inline Question" above.</div>
            ) : (
              bankQuestions
                .filter((q) => !bankSearch || q.questionText.toLowerCase().includes(bankSearch.toLowerCase()))
                .map((q) => {
                  const isSelected = formData.questions.includes(q._id);
                  return (
                    <div
                      key={q._id}
                      onClick={() => toggleSelectQuestion(q)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                        isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {q.questionType || 'SINGLE_MCQ'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">{q.subject} • {q.topic}</span>
                          <span className="text-[10px] font-bold text-emerald-600 ml-auto">+{q.marks} Marks</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-normal line-clamp-2">{q.questionText}</p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Randomization Options */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Randomize Question Order for Each Student</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.randomizeOptions}
                onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Shuffle Option Choices (MCQ)</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 3: SCORING & VISIBILITY RULES */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 3: Scoring Mechanics & Post-Exam Visibility
          </h3>

          <div className="space-y-6 text-xs">
            {/* Negative Marking */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.negativeMarking}
                  onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-slate-800 text-sm">Enable Negative Marking</span>
              </label>

              {formData.negativeMarking && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-slate-600 font-semibold">Penalty for incorrect answers:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={formData.negativeMarkPenalty}
                    onChange={(e) => setFormData({ ...formData, negativeMarkPenalty: e.target.value })}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-rose-600"
                  />
                  <span className="text-slate-400">marks per wrong answer</span>
                </div>
              )}
            </div>

            {/* Visibility Settings */}
            <div className="space-y-3">
              <span className="font-bold text-slate-700 uppercase tracking-wider block">Candidate Result Visibility</span>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showResultImmediately}
                  onChange={(e) => setFormData({ ...formData, showResultImmediately: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Show result score and pass/fail status immediately after submission</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showCorrectAnswers}
                  onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Reveal correct answers in candidate result review</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showExplanations}
                  onChange={(e) => setFormData({ ...formData, showExplanations: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Display solution explanations to candidates</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showLeaderboard}
                  onChange={(e) => setFormData({ ...formData, showLeaderboard: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Include exam in dynamic leaderboard ranking</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PROCTORING & INTEGRITY */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 4: Automated Proctoring & Exam Integrity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Camera */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Video className="w-5 h-5" />
                <span>Camera Verification</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Mandatory pre-flight hardware readiness check and active stream monitoring. No raw video uploaded or recorded.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.cameraRequired}
                  onChange={(e) => setFormData({ ...formData, cameraRequired: e.target.checked, cameraMonitoringEnabled: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Require Camera Readiness</span>
              </label>
            </div>

            {/* Microphone */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Mic className="w-5 h-5" />
                <span>Microphone Monitoring</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Detects background sound spikes and audio disruptions. Audio decibel telemetry only, zero raw audio storage.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.microphoneRequired}
                  onChange={(e) => setFormData({ ...formData, microphoneRequired: e.target.checked, microphoneMonitoringEnabled: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Require Microphone</span>
              </label>
            </div>

            {/* Fullscreen */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Maximize className="w-5 h-5" />
                <span>Fullscreen Enforcement</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Locks testing session into fullscreen. Flags window blurs, tab switching, and developer tools inspection.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.fullscreenRequired}
                  onChange={(e) => setFormData({ ...formData, fullscreenRequired: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Enforce Fullscreen</span>
              </label>

              {formData.fullscreenRequired && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Max Allowed Exits:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxFullscreenExits}
                      onChange={(e) => setFormData({ ...formData, maxFullscreenExits: e.target.value })}
                      className="w-16 px-2 py-0.5 rounded border border-slate-300 font-bold"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.terminateAfterFullscreenExits}
                      onChange={(e) => setFormData({ ...formData, terminateAfterFullscreenExits: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span className="text-[11px]">Auto-terminate on exceeding exits</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW SNAPSHOT */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 flex items-start gap-3">
            <Lock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Enterprise Immutable Exam Snapshot
              </h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                When you publish this assessment, ExamSphere will capture an immutable snapshot of all {formData.questions.length} questions and rules. Subsequent changes or edits made in the Question Bank will NOT alter this exam or any active candidate sessions.
              </p>
            </div>
          </div>

          {/* Exam Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Questions</span>
              <span className="text-lg font-black text-slate-900">{formData.questions.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Marks</span>
              <span className="text-lg font-black text-slate-900">{formData.totalMarks}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Duration</span>
              <span className="text-lg font-black text-slate-900">{formData.duration} mins</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Passing Score</span>
              <span className="text-lg font-black text-slate-900">{formData.passingPercentage}%</span>
            </div>
          </div>

          {/* Questions Preview List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Included Questions</h4>
            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {formData.selectedQuestionsList.map((q, idx) => (
                <div key={q._id} className="p-3 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800 truncate">{q.questionText}</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex-shrink-0">+{q.marks}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: PUBLISH OPTIONS */}
      {currentStep === 6 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Ready to Finalize Examination
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose how you would like to deploy "{formData.title}". You can publish immediately to candidates, schedule for a future date, or save as a draft to edit later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
            <button
              onClick={() => handleFinalizeExam('PUBLISHED')}
              disabled={saving}
              className="p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs space-y-2 shadow-lg shadow-indigo-200 transition group text-left disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition" />
              <p className="text-sm font-black">Publish & Go Live</p>
              <p className="text-[11px] text-indigo-100 font-normal">Freeze snapshot and immediately open examination to eligible candidates.</p>
            </button>

            <button
              onClick={() => handleFinalizeExam('SCHEDULED')}
              disabled={saving}
              className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs space-y-2 shadow-lg transition text-left disabled:opacity-50"
            >
              <Calendar className="w-5 h-5 text-slate-300" />
              <p className="text-sm font-black">Schedule Examination</p>
              <p className="text-[11px] text-slate-300 font-normal">Freeze snapshot and activate automatically during the scheduled window.</p>
            </button>

            <button
              onClick={() => handleFinalizeExam('DRAFT')}
              disabled={saving}
              className="p-5 rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs space-y-2 transition text-left disabled:opacity-50"
            >
              <Save className="w-5 h-5 text-slate-500" />
              <p className="text-sm font-black">Save as Draft</p>
              <p className="text-[11px] text-slate-500 font-normal">Save progress to review or author more questions prior to freezing snapshot.</p>
            </button>
          </div>
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {currentStep < 6 && (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-200"
          >
            <span>Proceed</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* INLINE QUESTION CREATOR MODAL */}
      {inlineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Author Question Inline</span>
              </h4>
              <button onClick={() => setInlineModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInlineQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Format</label>
                <select
                  value={inlineData.questionType}
                  onChange={(e) => setInlineData({ ...inlineData, questionType: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                >
                  <option value="SINGLE_MCQ">Single Choice MCQ</option>
                  <option value="MULTIPLE_MCQ">Multiple Choice MCQ</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="NUMERICAL">Numerical (with tolerance)</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Statement *</label>
                <textarea
                  required
                  rows={2}
                  value={inlineData.questionText}
                  onChange={(e) => setInlineData({ ...inlineData, questionText: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              {/* Type Options */}
              {inlineData.questionType === 'SINGLE_MCQ' && (
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-700 block mb-1">Options (Check radio for correct)</span>
                  {inlineData.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="inlineRadio"
                        checked={inlineData.correctAnswer === opt.id}
                        onChange={() => setInlineData({ ...inlineData, correctAnswer: opt.id })}
                      />
                      <span className="font-bold w-4">{opt.id}.</span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const n = [...inlineData.options];
                          n[idx].text = e.target.value;
                          setInlineData({ ...inlineData, options: n });
                        }}
                        className="flex-1 px-2 py-1 rounded border border-slate-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {inlineData.questionType === 'NUMERICAL' && (
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block">Target Number *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={inlineData.numericalAnswer}
                      onChange={(e) => setInlineData({ ...inlineData, numericalAnswer: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block">Tolerance (±)</label>
                    <input
                      type="number"
                      step="any"
                      value={inlineData.numericalTolerance}
                      onChange={(e) => setInlineData({ ...inlineData, numericalTolerance: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {inlineData.questionType === 'FILL_BLANK' && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <label className="font-bold text-slate-700 block">Accepted Answers (comma-separated) *</label>
                  <input
                    type="text"
                    required
                    value={inlineData.acceptedAnswersText}
                    onChange={(e) => setInlineData({ ...inlineData, acceptedAnswersText: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={inlineData.marks}
                    onChange={(e) => setInlineData({ ...inlineData, marks: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={inlineData.topic}
                    onChange={(e) => setInlineData({ ...inlineData, topic: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Explanation *</label>
                <textarea
                  rows={2}
                  required
                  value={inlineData.explanation}
                  onChange={(e) => setInlineData({ ...inlineData, explanation: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInlineModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Save & Attach to Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCreateExamPage;
