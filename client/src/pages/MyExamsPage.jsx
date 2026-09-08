import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  RotateCcw,
  Trophy,
  Layers,
} from 'lucide-react';

export const MyExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'UPCOMING'

  useEffect(() => {
    const fetchMyExams = async () => {
      try {
        setLoading(true);
        const res = await api.get('/exams');
        if (res.data && res.data.data) {
          setExams(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load my exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyExams();
  }, []);

  const filteredExams = exams.filter((e) => {
    if (activeTab === 'IN_PROGRESS') return e.hasActiveSession;
    if (activeTab === 'COMPLETED') return e.userAttemptsCount > 0 && !e.hasActiveSession;
    if (activeTab === 'UPCOMING') return e.computedStatus === 'SCHEDULED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Assessment Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor active examination attempts, retakes, and completed test results.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Exams' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'UPCOMING', label: 'Upcoming' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title="No assessments found in this view"
          description="Browse the catalog to enroll in upcoming mock assessments."
          actionText="Browse Available Exams"
          actionLink="/exams"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {exam.subject}
                  </span>
                  <span
                    className={`font-semibold ${
                      exam.hasActiveSession
                        ? 'text-amber-600 font-bold'
                        : exam.userAttemptsCount > 0
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {exam.hasActiveSession
                      ? 'In Progress'
                      : exam.userAttemptsCount > 0
                      ? 'Completed'
                      : 'Available'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.description || 'Structured timed exam designed to test core domain competencies.'}
                </p>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {exam.duration} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    Attempts: {exam.userAttemptsCount || 0}/{exam.maximumAttempts || 1}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                {exam.hasActiveSession ? (
                  <Link
                    to={`/exam/${exam._id}`}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resume Attempt</span>
                  </Link>
                ) : (
                  <Link
                    to={`/exam/${exam._id}`}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Exam</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
