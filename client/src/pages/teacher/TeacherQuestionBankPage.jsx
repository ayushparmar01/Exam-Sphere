import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import {
  BookOpen,
  Edit2,
  Filter,
  PlusCircle,
  Search,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  Copy,
  Archive,
  RefreshCw,
  Hash,
  Type,
  ToggleLeft,
  CheckSquare,
  Square,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export const TeacherQuestionBankPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedScope, setSelectedScope] = useState('all'); // 'all' or 'mine'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Form State for Authoring 5 Question Types
  const [formData, setFormData] = useState({
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
    acceptedAnswersText: '', // comma-separated
    explanation: '',
    subject: 'DSA',
    topic: 'General',
    subtopic: '',
    difficulty: 'Medium',
    marks: 1,
    negativeMarks: 0.25,
    estimatedTime: 60,
  });

  const subjects = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'AI Fundamentals', 'Mathematics', 'Software Engineering'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const questionTypes = [
    { value: 'All', label: 'All Question Types' },
    { value: 'SINGLE_MCQ', label: 'Single Choice MCQ' },
    { value: 'MULTIPLE_MCQ', label: 'Multiple Choice MCQ' },
    { value: 'TRUE_FALSE', label: 'True / False' },
    { value: 'NUMERICAL', label: 'Numerical Value' },
    { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  ];

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      if (selectedType !== 'All') params.append('questionType', selectedType);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedScope !== 'all') params.append('scope', selectedScope);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data && res.data.data) {
        setQuestions(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQuestions();
    }, 250);
    return () => clearTimeout(handler);
  }, [search, selectedSubject, selectedDifficulty, selectedType, selectedStatus, selectedScope, page]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
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
      subject: selectedSubject !== 'All' ? selectedSubject : 'DSA',
      topic: 'General',
      subtopic: '',
      difficulty: 'Medium',
      marks: 1,
      negativeMarks: 0.25,
      estimatedTime: 60,
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (q) => {
    setEditingQuestion(q);
    const qType = q.questionType || 'SINGLE_MCQ';
    setFormData({
      questionText: q.questionText,
      questionType: qType,
      options: q.options?.length > 0 ? q.options : [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
      ],
      correctAnswer: q.correctAnswer || (qType === 'TRUE_FALSE' ? 'T' : 'A'),
      correctAnswers: q.correctAnswers || ['A'],
      numericalAnswer: q.numericalAnswer !== null && q.numericalAnswer !== undefined ? q.numericalAnswer : '',
      numericalTolerance: q.numericalTolerance || 0,
      acceptedAnswersText: (q.acceptedAnswers || []).join(', '),
      explanation: q.explanation || '',
      subject: q.subject || 'DSA',
      topic: q.topic || 'General',
      subtopic: q.subtopic || '',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      estimatedTime: q.estimatedTime || 60,
    });
    setModalOpen(true);
  };

  // Duplicate Question
  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/questions/${id}/duplicate`);
      if (res.data?.success) {
        showNotification('Question duplicated successfully!');
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate question');
    }
  };

  // Archive Question
  const handleArchive = async (id) => {
    try {
      const res = await api.patch(`/questions/${id}/archive`);
      if (res.data?.success) {
        showNotification('Question archived.');
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive question');
    }
  };

  // Restore Question
  const handleRestore = async (id) => {
    try {
      const res = await api.patch(`/questions/${id}/restore`);
      if (res.data?.success) {
        showNotification('Question restored to Active.');
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore question');
    }
  };

  // Bulk Archive
  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.patch('/questions/bulk-archive', { questionIds: selectedIds });
      showNotification(`Archived ${selectedIds.length} questions.`);
      setSelectedIds([]);
      fetchQuestions();
    } catch (err) {
      alert('Bulk archive failed.');
    }
  };

  // Bulk Restore
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.patch('/questions/bulk-restore', { questionIds: selectedIds });
      showNotification(`Restored ${selectedIds.length} questions.`);
      setSelectedIds([]);
      fetchQuestions();
    } catch (err) {
      alert('Bulk restore failed.');
    }
  };

  // Save Question (Create or Edit)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        questionText: formData.questionText,
        questionType: formData.questionType,
        subject: formData.subject,
        topic: formData.topic,
        subtopic: formData.subtopic,
        difficulty: formData.difficulty,
        marks: Number(formData.marks) || 1,
        negativeMarks: Number(formData.negativeMarks) || 0,
        explanation: formData.explanation,
        estimatedTime: Number(formData.estimatedTime) || 60,
      };

      if (formData.questionType === 'SINGLE_MCQ') {
        payload.options = formData.options.map((o) => ({ id: o.id.trim(), text: o.text.trim() }));
        payload.correctAnswer = formData.correctAnswer.trim().toUpperCase();
      } else if (formData.questionType === 'MULTIPLE_MCQ') {
        payload.options = formData.options.map((o) => ({ id: o.id.trim(), text: o.text.trim() }));
        payload.correctAnswers = formData.correctAnswers;
      } else if (formData.questionType === 'TRUE_FALSE') {
        payload.options = [
          { id: 'T', text: 'True' },
          { id: 'F', text: 'False' },
        ];
        payload.correctAnswer = formData.correctAnswer === 'F' ? 'F' : 'T';
      } else if (formData.questionType === 'NUMERICAL') {
        payload.numericalAnswer = Number(formData.numericalAnswer);
        payload.numericalTolerance = Number(formData.numericalTolerance) || 0;
      } else if (formData.questionType === 'FILL_BLANK') {
        const list = formData.acceptedAnswersText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        payload.acceptedAnswers = list;
      }

      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion._id}`, payload);
        showNotification('Question updated successfully!');
      } else {
        await api.post('/questions', payload);
        showNotification('Question created and added to bank!');
      }

      setModalOpen(false);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'MULTIPLE_MCQ':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Multi MCQ</span>;
      case 'TRUE_FALSE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">True / False</span>;
      case 'NUMERICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Numerical</span>;
      case 'FILL_BLANK':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Fill Blank</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Single MCQ</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-500/30 flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Faculty Question Bank</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author, organize, duplicate, and manage multi-type examination questions with full tolerance and answer verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search questions or tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Question Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {questionTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Difficulties' : d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Active">Active Questions</option>
              <option value="Archived">Archived Questions</option>
              <option value="All">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Scope Tabs & Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedScope === 'all'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Bank Questions ({totalCount})
            </button>
            <button
              onClick={() => setSelectedScope('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedScope === 'mine'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Authored by Me
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">{selectedIds.length} selected</span>
              <button
                onClick={handleBulkArchive}
                className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 transition"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Selected</span>
              </button>
              <button
                onClick={handleBulkRestore}
                className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Questions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={BookOpen}
              title="No questions match criteria"
              description="Adjust your search filters or click 'Add Question' to create a new item."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === questions.length && questions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Question Statement</th>
                  <th className="p-3.5">Subject & Topic</th>
                  <th className="p-3.5">Difficulty</th>
                  <th className="p-3.5">Marks</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => {
                  const isChecked = selectedIds.includes(q._id);
                  const qType = q.questionType || 'SINGLE_MCQ';
                  return (
                    <tr key={q._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(q._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">{getTypeBadge(qType)}</td>
                      <td className="p-3.5 max-w-xs sm:max-w-md">
                        <p className="font-semibold text-slate-800 line-clamp-2">{q.questionText}</p>
                        {q.subtopic && (
                          <span className="text-[10px] text-slate-400">Subtopic: {q.subtopic}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{q.subject}</p>
                        <p className="text-[10px] text-slate-400">{q.topic}</p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        +{q.marks} {q.negativeMarks ? `(-${q.negativeMarks})` : ''}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'Archived'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {q.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Preview Question"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Question"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(q._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="Duplicate Question"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {q.status === 'Archived' ? (
                            <button
                              onClick={() => handleRestore(q._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Restore to Active"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(q._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Archive Question"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages} ({totalCount} total)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT QUESTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{editingQuestion ? 'Edit Question' : 'Author New Question'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              {/* Question Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Format / Type
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="SINGLE_MCQ">Single Choice MCQ (Radio)</option>
                  <option value="MULTIPLE_MCQ">Multiple Choice MCQ (Checkboxes)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="NUMERICAL">Numerical Answer (with tolerance)</option>
                  <option value="FILL_BLANK">Fill in the Blank (Accepted keywords)</option>
                </select>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Statement *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter problem statement clearly..."
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Dynamic Type Config Area */}

              {/* 1. SINGLE_MCQ Options */}
              {formData.questionType === 'SINGLE_MCQ' && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Options & Single Correct Answer</span>
                  {formData.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswerRadio"
                        checked={formData.correctAnswer === opt.id}
                        onChange={() => setFormData({ ...formData, correctAnswer: opt.id })}
                        className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <span className="font-bold w-5">{opt.id}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt.id} text`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...formData.options];
                          newOpts[idx].text = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400">Select the radio button next to the correct answer choice.</p>
                </div>
              )}

              {/* 2. MULTIPLE_MCQ Options */}
              {formData.questionType === 'MULTIPLE_MCQ' && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Options & Multiple Correct Answers</span>
                  {formData.options.map((opt, idx) => {
                    const isChecked = formData.correctAnswers.includes(opt.id);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const list = [...formData.correctAnswers];
                            const i = list.indexOf(opt.id);
                            if (i >= 0) list.splice(i, 1);
                            else list.push(opt.id);
                            setFormData({ ...formData, correctAnswers: list });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-bold w-5">{opt.id}.</span>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${opt.id} text`}
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx].text = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                        />
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-slate-400">Check all options that are correct solutions.</p>
                </div>
              )}

              {/* 3. TRUE_FALSE Toggle */}
              {formData.questionType === 'TRUE_FALSE' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">Correct Assertion</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="tfRadio"
                        value="T"
                        checked={formData.correctAnswer === 'T'}
                        onChange={() => setFormData({ ...formData, correctAnswer: 'T' })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="tfRadio"
                        value="F"
                        checked={formData.correctAnswer === 'F'}
                        onChange={() => setFormData({ ...formData, correctAnswer: 'F' })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 4. NUMERICAL Answer & Tolerance */}
              {formData.questionType === 'NUMERICAL' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Numeric Value *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 3.1415"
                      value={formData.numericalAnswer}
                      onChange={(e) => setFormData({ ...formData, numericalAnswer: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Precision Tolerance (±)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 0.01"
                      value={formData.numericalTolerance}
                      onChange={(e) => setFormData({ ...formData, numericalTolerance: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 5. FILL_BLANK Accepted Answers */}
              {formData.questionType === 'FILL_BLANK' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 block">Accepted Answer Strings (comma-separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. debugging, debug, defect removal"
                    value={formData.acceptedAnswersText}
                    onChange={(e) => setFormData({ ...formData, acceptedAnswersText: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Student answers will be matched case-insensitively against any of these accepted terms.</p>
                </div>
              )}

              {/* Subject, Topic, Subtopic */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  >
                    {subjects.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic *</label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtopic</label>
                  <input
                    type="text"
                    placeholder="Optional subtopic"
                    value={formData.subtopic}
                    onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Difficulty, Marks, Negative Marks */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negative Penalty</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Explanation / Solution Walkthrough *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why the solution is correct for candidate review..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingQuestion ? 'Update Question' : 'Save to Bank'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW QUESTION MODAL */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getTypeBadge(previewQuestion.questionType)}
                <span className="text-xs font-semibold text-slate-500">{previewQuestion.subject}</span>
              </div>
              <button onClick={() => setPreviewQuestion(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 leading-relaxed">
                {previewQuestion.questionText}
              </h4>

              {/* Options or Answer display */}
              {previewQuestion.options?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {previewQuestion.options.map((opt) => {
                    const isCorrect =
                      previewQuestion.correctAnswer === opt.id ||
                      (previewQuestion.correctAnswers || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isCorrect ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.id}. {opt.text}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {previewQuestion.questionType === 'NUMERICAL' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">Numerical Target: {previewQuestion.numericalAnswer}</p>
                  <p className="text-amber-700 text-[11px]">Tolerance: ±{previewQuestion.numericalTolerance || 0}</p>
                </div>
              )}

              {previewQuestion.questionType === 'FILL_BLANK' && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs">
                  <p className="font-bold text-rose-900">Accepted Answers:</p>
                  <p className="text-rose-700 text-[11px]">{(previewQuestion.acceptedAnswers || []).join(', ')}</p>
                </div>
              )}

              {/* Explanation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Explanation</span>
                <p className="text-slate-600 leading-normal">{previewQuestion.explanation}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherQuestionBankPage;
