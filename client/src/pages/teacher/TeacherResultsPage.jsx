import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import {
  FileCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Shield,
  Clock,
} from 'lucide-react';

export const TeacherResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || 'All';

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState(initialExamId);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load teacher exams list for filter dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams?limit=50');
        if (res.data?.data) {
          setExams(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load exams list:', err);
      }
    };
    fetchExams();
  }, []);

  // Fetch results from teacher analytics or admin results endpoint
  const fetchResults = async () => {
    try {
      setLoading(true);
      // Fetch comprehensive results
      const res = await api.get('/analytics/teacher');
      if (res.data?.data?.recentResults) {
        let list = res.data.data.recentResults;

        // Filter by Exam
        if (selectedExam !== 'All') {
          list = list.filter((r) => (r.examId?._id || r.examId) === selectedExam);
        }

        // Filter by Status
        if (selectedStatus === 'Passed') {
          list = list.filter((r) => r.isPassed);
        } else if (selectedStatus === 'Failed') {
          list = list.filter((r) => !r.isPassed);
        }

        // Filter by Search
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (r) =>
              r.studentId?.name?.toLowerCase().includes(q) ||
              r.studentId?.email?.toLowerCase().includes(q) ||
              r.examId?.title?.toLowerCase().includes(q)
          );
        }

        setTotalCount(list.length);
        setTotalPages(Math.max(1, Math.ceil(list.length / 10)));
        const start = (page - 1) * 10;
        setResults(list.slice(start, start + 10));
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [search, selectedExam, selectedStatus, page]);

  // Client-side CSV Export
  const exportToCSV = () => {
    if (results.length === 0) {
      alert('No results available to export.');
      return;
    }

    const headers = ['Candidate Name', 'Candidate Email', 'Exam Title', 'Subject', 'Score', 'Total Marks', 'Percentage', 'Accuracy', 'Passed', 'Date'];
    const rows = results.map((r) => [
      `"${r.studentId?.name || 'N/A'}"`,
      `"${r.studentId?.email || 'N/A'}"`,
      `"${r.examId?.title || 'N/A'}"`,
      `"${r.examId?.subject || 'N/A'}"`,
      r.score,
      r.totalMarks,
      `${r.percentage}%`,
      `${r.accuracy}%`,
      r.isPassed ? 'PASSED' : 'FAILED',
      `"${new Date(r.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamSphere_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-indigo-600" />
            <span>Candidate Examination Results</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review submitted student attempts, export certified performance records, and inspect score distributions.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search candidate name or email..."
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
            value={selectedExam}
            onChange={(e) => {
              setSelectedExam(e.target.value);
              setSearchParams(e.target.value !== 'All' ? { examId: e.target.value } : {});
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none max-w-xs truncate"
          >
            <option value="All">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>{ex.title}</option>
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
            <option value="All">All Results</option>
            <option value="Passed">Passed Candidates</option>
            <option value="Failed">Failed Candidates</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={FileCheck}
              title="No examination results found"
              description="Candidate scores and evaluations will automatically display here once examinations are completed."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Candidate</th>
                  <th className="p-3.5">Examination</th>
                  <th className="p-3.5">Score / Marks</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.studentId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{res.studentId?.name || 'Candidate'}</p>
                          <p className="text-[11px] text-slate-400">{res.studentId?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="font-semibold text-slate-800 line-clamp-1">{res.examId?.title || 'Examination'}</p>
                      <p className="text-[10px] text-slate-400">{res.examId?.subject}</p>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {res.score} / {res.totalMarks}
                    </td>
                    <td className="p-3.5 font-black text-slate-800">
                      {res.percentage}%
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {res.accuracy}%
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                          res.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {res.isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        {res.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(res.createdAt).toLocaleDateString()} {new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/results/${res.attemptId}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View Full Report"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/results/${res.attemptId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Download Certified PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
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

export default TeacherResultsPage;
