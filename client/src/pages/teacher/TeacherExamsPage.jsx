import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import {
  Shield,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileCheck,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  Lock,
} from 'lucide-react';

export const TeacherExamsPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionNotice, setActionNotice] = useState('');

  const subjects = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'AI Fundamentals', 'Mathematics', 'Software Engineering'];
  const statuses = ['All', 'DRAFT', 'SCHEDULED', 'LIVE', 'PUBLISHED', 'ENDED', 'ARCHIVED'];

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/exams?${params.toString()}`);
      if (res.data && res.data.data) {
        setExams(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load teacher exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchExams();
    }, 250);
    return () => clearTimeout(handler);
  }, [search, selectedSubject, selectedStatus, page]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  // Publish Draft Exam (generates immutable snapshot)
  const handlePublishExam = async (id) => {
    try {
      const res = await api.patch(`/exams/${id}/publish`);
      if (res.data?.success) {
        showNotification('Exam successfully published with frozen immutable snapshot!');
        fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish exam');
    }
  };

  // Archive Exam
  const handleArchiveExam = async (id) => {
    if (!window.confirm('Are you sure you want to archive this examination?')) return;
    try {
      const res = await api.patch(`/exams/${id}/archive`);
      if (res.data?.success) {
        showNotification('Exam archived.');
        fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive exam');
    }
  };

  const getStatusBadge = (status, computed) => {
    const effective = computed || status || 'DRAFT';
    switch (effective) {
      case 'LIVE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE NOW
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            PUBLISHED
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            SCHEDULED
          </span>
        );
      case 'DRAFT':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            DRAFT
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {effective}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
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
            <Shield className="w-7 h-7 text-indigo-600" />
            <span>Faculty Examination Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your created assessments, publish drafts to freeze immutable question snapshots, and review candidate attempt streams.
          </p>
        </div>

        <Link
          to="/teacher/exams/create"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Exam</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search exams by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Shield}
              title="No examinations found"
              description="Click 'Create New Exam' to author your first assessment."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Exam Title & Details</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Questions</th>
                  <th className="p-3.5">Passing %</th>
                  <th className="p-3.5">Snapshot</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex) => {
                  const hasSnapshot = !!(ex.snapshot && ex.snapshot.frozenAt);
                  return (
                    <tr key={ex._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">{getStatusBadge(ex.status, ex.computedStatus)}</td>
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-slate-900 line-clamp-1">{ex.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ex.description || 'No description provided'}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{ex.subject}</td>
                      <td className="p-3.5">{ex.duration} mins</td>
                      <td className="p-3.5 font-bold text-slate-800">{ex.questions?.length || 0} ({ex.totalMarks}m)</td>
                      <td className="p-3.5">{ex.passingPercentage}%</td>
                      <td className="p-3.5">
                        {hasSnapshot ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 w-fit" title={`Frozen at: ${new Date(ex.snapshot.frozenAt).toLocaleString()}`}>
                            <Lock className="w-3 h-3" />
                            Frozen
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Not Frozen</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ex.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublishExam(ex._id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition flex items-center gap-1"
                              title="Publish exam and freeze snapshot"
                            >
                              <Send className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          <Link
                            to={`/admin/monitoring`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Live Proctoring Center"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/teacher/results?examId=${ex._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="View Student Results"
                          >
                            <FileCheck className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/exam/${ex._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Preview Instructions"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {ex.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => handleArchiveExam(ex._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Archive Exam"
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

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages} ({totalCount} total)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamsPage;
