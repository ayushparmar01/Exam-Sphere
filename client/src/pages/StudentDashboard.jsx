import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { CardSkeleton } from '../components/SkeletonLoader';
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Flame,
  LineChart as LineChartIcon,
  Play,
  RotateCcw,
  Target,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, examsRes, resultsRes] = await Promise.all([
          api.get('/analytics/student'),
          api.get('/exams?limit=3'),
          api.get('/results/my-results?limit=5'),
        ]);

        if (analyticsRes.data) {
          setDashboardData(analyticsRes.data);
        }
        if (examsRes.data && examsRes.data.data) {
          setUpcomingExams(examsRes.data.data);
        }
        if (resultsRes.data && resultsRes.data.data) {
          setRecentResults(resultsRes.data.data);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-10 bg-slate-200 rounded w-1/3 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const summary = dashboardData?.summary || user?.stats || {};
  const scoreTrend = dashboardData?.scoreTrend || [];
  const subjectPerformance = dashboardData?.subjectPerformance || [];
  const weakAreas = dashboardData?.weakAreas || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your assessment trajectory, analyze areas for growth, and take certified mock tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/exams"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Browse Exams
          </Link>
          <Link
            to="/schedule"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            My Schedule
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tests"
          value={summary.testsTaken || 0}
          subtitle="Enrolled / Started"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Tests Completed"
          value={summary.testsCompleted || 0}
          subtitle="Evaluated"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${summary.averageScore || 0}%`}
          subtitle="Across attempts"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Accuracy"
          value={`${summary.accuracy || 0}%`}
          subtitle="Correct answers ratio"
          icon={Target}
          color="amber"
        />
        <StatCard
          title="Best Score"
          value={`${summary.bestScore || 0}%`}
          subtitle="Peak achievement"
          icon={Trophy}
          color="emerald"
        />
        <StatCard
          title="Current Rank"
          value="#4"
          subtitle="Platform benchmark"
          icon={Award}
          color="indigo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Over Time Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-indigo-600" />
                Performance Over Time
              </h3>
              <p className="text-xs text-slate-400">Score percentage progression across recent tests</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Dynamic Tracking
            </span>
          </div>

          {scoreTrend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="testNumber" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1b4b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Score %"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <LineChartIcon className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No test attempts recorded yet.</p>
              <Link to="/exams" className="text-xs font-bold text-indigo-600 hover:underline mt-1">
                Take your first assessment →
              </Link>
            </div>
          )}
        </div>

        {/* Subject Performance Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Subject Performance</h3>
            <p className="text-xs text-slate-400 mb-5">Mastery by tested domain</p>

            {subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {subjectPerformance.map((subj, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{subj.subject}</span>
                      <span className="text-slate-900 font-bold">{subj.accuracy}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          subj.accuracy >= 75
                            ? 'bg-emerald-500'
                            : subj.accuracy >= 50
                            ? 'bg-indigo-600'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, subj.accuracy))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-400 py-6 text-center">
                <p>Complete mock tests across DSA, DBMS, and OS to reveal subject mastery levels.</p>
              </div>
            )}
          </div>

          {/* Weak Areas Alert Strip */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Focus Areas for Revision
            </h4>
            {weakAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((w, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100"
                  >
                    <span>{w.topic}</span>
                    <span className="text-[10px] opacity-75 font-normal">({w.accuracy}%)</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No critical weak topics detected. Maintain your revision!</p>
            )}
          </div>
        </div>
      </div>

      {/* Available / Upcoming Exams Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Upcoming & Available Assessments</h3>
            <p className="text-xs text-slate-500">Pick from verified practice examinations</p>
          </div>
          <Link to="/exams" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All Exams →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingExams.map((exam) => (
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
                      exam.difficulty === 'Hard'
                        ? 'text-rose-600'
                        : exam.difficulty === 'Medium'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {exam.difficulty}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 line-clamp-1">{exam.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.description || 'Comprehensive multiple-choice assessment designed for high concept retention.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {exam.duration} mins
                  </span>
                  <span>{exam.totalMarks || exam.questions?.length || 10} Marks</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <Link
                  to={`/exam/${exam._id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <span>View Exam Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Assessment Results</h3>
            <p className="text-xs text-slate-400">Review your past submissions and mistake breakdowns</p>
          </div>
          <Link to="/results/my-results" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            Full Results History →
          </Link>
        </div>

        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentResults.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.examId?.title || 'Assessment'}</td>
                    <td className="py-3 px-4">
                      {r.score}/{r.totalMarks} ({r.percentage}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.accuracy}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.isPassed ? 'PASSED' : 'NOT PASSED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/results/${r.attemptId}`}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                      >
                        View Result →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No completed assessments yet. Your score trajectory and mistakes will appear here after taking your first test.
          </div>
        )}
      </div>
    </div>
  );
};
