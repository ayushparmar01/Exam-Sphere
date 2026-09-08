import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import {
  Clock,
  Edit2,
  Layers,
  PlusCircle,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

export const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams?limit=50');
      if (res.data && res.data.data) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (id) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      fetchExams();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this examination?')) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Examination Governance
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-semibold">{exams.length} Configured Exams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assessment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure test lifecycles, publish/unpublish mock assessments, and set result visibility controls.
          </p>
        </div>

        <Link
          to="/admin/exams/create"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Author New Exam</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams by title or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No assessments found"
          description="Create and publish your first examination to begin candidate evaluations."
          actionText="Create Assessment"
          actionLink="/admin/exams/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const isLive = exam.status === 'LIVE';

            return (
              <div
                key={exam._id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                      {exam.subject}
                    </span>
                    <button
                      onClick={() => handleTogglePublish(exam._id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LIVE
                        </>
                      ) : (
                        <>DRAFT</>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {exam.description || 'Configured evaluation assessment.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">{exam.duration}m</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {exam.questions?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Marks</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {exam.totalMarks || 10} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <Link
                    to={`/exam/${exam._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(exam._id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"
                    >
                      {isLive ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(exam._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Archive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
