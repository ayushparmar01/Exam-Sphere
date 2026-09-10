import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  PlusCircle,
  Shield,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  AlertTriangle,
  Play,
  ArrowUpRight,
} from 'lucide-react';

export const TeacherDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    liveExams: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    completedAttempts: 0,
    avgScore: 0,
    passRate: 0,
  });
  const [myExams, setMyExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Teacher Analytics KPIs
        const analyticsRes = await api.get('/analytics/teacher').catch(() => null);
        if (analyticsRes?.data?.data) {
          const d = analyticsRes.data.data;
          setStats({
            ...d.kpis,
            liveExams: d.kpis.liveExams || 0,
          });
          setRecentResults(d.recentResults || []);
        }

        // 2. Fetch Teacher's Exams
        const examsRes = await api.get('/exams?limit=6').catch(() => null);
        if (examsRes?.data?.data) {
          setMyExams(examsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Faculty Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 pointer-events-none rounded-r-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold tracking-wide uppercase">
                Faculty Portal
              </span>
              {user?.department && (
                <span className="text-xs text-indigo-300 font-medium">
                  • {user.department}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Professor'}!
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-xl leading-relaxed">
              Design comprehensive assessments, manage your question bank across 5 question types, monitor live student sessions in real-time, and analyze class performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/teacher/exams/create"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-indigo-500/25 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Exam</span>
            </Link>
            <Link
              to="/teacher/questions"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur transition flex items-center gap-2 border border-white/10"
            >
              <BookOpen className="w-4 h-4" />
              <span>Question Bank</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Exams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">My Exams</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalExams}</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{stats.publishedExams} Published</p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Question Bank</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalQuestions}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">5 Question Types</p>
          </div>
        </div>

        {/* Student Attempts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Submissions</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.completedAttempts}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{stats.passRate}% Pass Rate</p>
          </div>
        </div>

        {/* Class Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Score</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.avgScore}%</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Class Average</p>
          </div>
        </div>
      </div>

      {/* Quick Action Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/teacher/exams/create"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
              6-Step Exam Creation Flow
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Step-by-step wizard to configure exam details, select or author inline questions, set rules, enforce proctoring, and freeze immutable snapshot.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-600 mt-4 gap-1">
            <span>Launch Wizard</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/monitoring"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Live Proctoring Center
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Real-time monitoring console with candidate telemetry stream, tab switch tracking, device state feeds, and supervisor review flags.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 mt-4 gap-1">
            <span>Open Monitor</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/teacher/analytics"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Teacher Analytics & Insights
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Score distributions, difficulty error rates, question quality analysis, and integrity risk breakdowns for all your exams.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-purple-600 mt-4 gap-1">
            <span>View Reports</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Two Column Section: My Exams & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active & Recent Exams (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>My Examination Assessments</span>
            </h2>
            <Link
              to="/teacher/exams"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all ({myExams.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {myExams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <Shield className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No exams created yet</p>
                <p className="text-xs text-slate-400">Get started by creating your first scheduled assessment.</p>
                <Link
                  to="/teacher/exams/create"
                  className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-500 transition"
                >
                  Create Exam
                </Link>
              </div>
            ) : (
              myExams.map((ex) => (
                <div
                  key={ex._id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ex.status === 'LIVE' || ex.computedStatus === 'LIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ex.status === 'PUBLISHED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : ex.status === 'SCHEDULED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ex.status || 'DRAFT'}
                      </span>
                      <span className="text-xs font-medium text-slate-400">• {ex.subject}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{ex.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {ex.duration} mins
                      </span>
                      <span>•</span>
                      <span>{ex.questions?.length || 0} Questions</span>
                      <span>•</span>
                      <span>{ex.totalMarks} Marks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/monitoring`}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Live Monitoring"
                    >
                      <Activity className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/teacher/results?examId=${ex._id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Results
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Candidate Submissions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Recent Submissions</span>
            </h2>
            <Link
              to="/teacher/results"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm divide-y divide-slate-100">
            {recentResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No student submissions recorded yet.
              </div>
            ) : (
              recentResults.slice(0, 5).map((res) => (
                <div key={res._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={res.studentId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {res.studentId?.name || 'Student Candidate'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {res.examId?.title || 'Examination'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-black ${res.isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {res.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {res.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
