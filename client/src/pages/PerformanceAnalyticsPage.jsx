import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CardSkeleton } from '../components/SkeletonLoader';
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const PerformanceAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/student');
        if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load performance analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const summary = data?.summary || {};
  const scoreTrend = data?.scoreTrend || [];
  const subjectPerformance = data?.subjectPerformance || [];
  const difficultyPerformance = data?.difficultyPerformance || [];

  // Correct vs Incorrect vs Unattempted Pie Data
  const responseBreakdown = [
    { name: 'Correct', value: summary.totalCorrect || 0, color: '#10b981' },
    { name: 'Incorrect', value: summary.totalIncorrect || 0, color: '#ef4444' },
    { name: 'Unattempted', value: summary.totalUnattempted || 0, color: '#94a3b8' },
  ].filter((item) => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            In-Depth Telemetry
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Performance Analytics & Mastery Trajectory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Comprehensive visualizations tracking longitudinal score evolution, accuracy rates, domain proficiencies, and response efficiency.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Score</span>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{summary.averageScore || 0}%</p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Across {summary.testsTaken || 0} tests</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Accuracy</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.accuracy || 0}%</p>
          <span className="text-[11px] text-slate-400 block mt-0.5">{summary.totalCorrect || 0} correct items</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Peak Performance</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{summary.bestScore || 0}%</p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Highest single test score</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Items Handled</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalQuestions || 0}</p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Tested questions</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score & Accuracy Progression */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-indigo-600" />
                Score & Accuracy Trajectory
              </h3>
              <p className="text-xs text-slate-400">Score percentage (indigo) vs Accuracy percentage (emerald)</p>
            </div>
          </div>

          {scoreTrend.length > 0 ? (
            <div className="h-72">
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
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Score %"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-xs text-slate-400">
              No test attempts recorded yet.
            </div>
          )}
        </div>

        {/* Response Breakdown Pie */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              Item Response Distribution
            </h3>
            <p className="text-xs text-slate-400">Correct vs Incorrect vs Unattempted</p>
          </div>

          {responseBreakdown.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={responseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {responseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1b4b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400">
              No items answered yet.
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
            Total of {summary.totalQuestions || 0} evaluated questions across all sessions
          </div>
        </div>
      </div>

      {/* Domain & Difficulty Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subject Accuracy Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-indigo-600" />
            Subject Accuracy Comparison
          </h3>
          <p className="text-xs text-slate-400">Mean accuracy percentage by domain</p>

          {subjectPerformance.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
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
                  <Bar dataKey="accuracy" name="Accuracy %" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Complete assessments in DSA and DBMS to populate domain analytics.
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Difficulty-Wise Mastery
          </h3>
          <p className="text-xs text-slate-400">Accuracy rate by question difficulty tier</p>

          {difficultyPerformance.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="difficulty" stroke="#94a3b8" fontSize={11} />
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
                  <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No difficulty metrics available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
