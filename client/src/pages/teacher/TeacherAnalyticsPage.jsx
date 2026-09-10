import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileCheck,
  Users,
  Clock,
  Loader2,
  Percent,
  Activity,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export const TeacherAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/teacher');
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load teacher analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Aggregating Faculty Analytics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const scoreDistribution = data?.scoreDistribution || [];
  const integrityBreakdown = data?.integrityBreakdown || { lowRisk: 0, mediumRisk: 0, highRisk: 0 };
  const mostDifficult = data?.mostDifficult || [];
  const mostSkipped = data?.mostSkipped || [];
  const recentResults = data?.recentResults || [];

  const maxDistCount = Math.max(...scoreDistribution.map((d) => d.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <span>Faculty Examination Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time performance distributions, question difficulty metrics, and integrity compliance.
          </p>
        </div>

        <Link
          to="/teacher/results"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
        >
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>View All Candidate Records</span>
        </Link>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.avgScore || 0}%</p>
          <p className="text-[11px] text-slate-400">Class average across all exams</p>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.passRate || 0}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">{kpis.completedAttempts || 0} passed evaluations</p>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.avgAccuracy || 0}%</p>
          <p className="text-[11px] text-slate-400">Correct vs total attempted</p>
        </div>

        {/* Total Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.completedAttempts || 0}</p>
          <p className="text-[11px] text-purple-600 font-semibold">{kpis.completionRate || 0}% completion rate</p>
        </div>
      </div>

      {/* Two Column Layout: Score Distribution & Integrity Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score Distribution (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Score Distribution Brackets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Candidate distribution by percentage brackets.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{kpis.completedAttempts || 0} Total Submissions</span>
          </div>

          <div className="space-y-4 pt-2">
            {scoreDistribution.map((b) => {
              const pctOfTotal = kpis.completedAttempts > 0 ? Math.round((b.count / kpis.completedAttempts) * 100) : 0;
              const barWidth = Math.round((b.count / maxDistCount) * 100);

              let color = 'bg-indigo-600';
              if (b.range === '0-20%') color = 'bg-rose-500';
              else if (b.range === '21-40%') color = 'bg-amber-500';
              else if (b.range === '41-60%') color = 'bg-blue-500';
              else if (b.range === '61-80%') color = 'bg-indigo-500';
              else color = 'bg-emerald-500';

              return (
                <div key={b.range} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-700 w-16">{b.range}</span>
                    <div className="flex-1 mx-3 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-slate-800 font-bold w-12 text-right">
                      {b.count} ({pctOfTotal}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrity Risk Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Integrity Breakdown</span>
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Automated proctoring risk classification based on browser blurs, tab switches, and device telemetry.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">Low Risk (Compliant)</span>
              </div>
              <span className="text-base font-black text-emerald-700">{integrityBreakdown.lowRisk}</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-600" />
                <span className="text-xs font-bold text-amber-950">Medium Risk (Warning)</span>
              </div>
              <span className="text-base font-black text-amber-700">{integrityBreakdown.mediumRisk}</span>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-xs font-bold text-rose-950">High Risk (Flagged)</span>
              </div>
              <span className="text-base font-black text-rose-700">{integrityBreakdown.highRisk}</span>
            </div>
          </div>

          <Link
            to="/admin/monitoring"
            className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
          >
            Open Live Proctoring Monitor
          </Link>
        </div>
      </div>

      {/* Most Difficult Questions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Question Difficulty & Error Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Questions with lowest candidate accuracy rates across all attempts.</p>
          </div>
          <Link to="/teacher/questions" className="text-xs font-semibold text-indigo-600 hover:underline">
            Manage Question Bank
          </Link>
        </div>

        {mostDifficult.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No question evaluations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Question Statement</th>
                  <th className="p-3">Subject & Topic</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mostDifficult.map((q) => (
                  <tr key={q.questionId} className="hover:bg-slate-50/80">
                    <td className="p-3 max-w-md font-semibold text-slate-800 line-clamp-1">
                      {q.questionText}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{q.subject}</span>
                      <span className="text-[10px] text-slate-400 block">{q.topic}</span>
                    </td>
                    <td className="p-3 font-semibold">{q.difficulty}</td>
                    <td className="p-3 font-bold text-slate-800">{q.attempts}</td>
                    <td className="p-3 font-bold text-emerald-600">{q.accuracy}%</td>
                    <td className="p-3">
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {q.errorRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Candidate Evaluations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Submissions evaluated across your faculty examinations.</p>
          </div>
          <Link to="/teacher/results" className="text-xs font-semibold text-indigo-600 hover:underline">
            View All Results
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No submissions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentResults.slice(0, 5).map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{r.studentId?.name || 'Student Candidate'}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.examId?.title || 'Exam'}</td>
                    <td className="p-3 font-bold">{r.score} / {r.totalMarks}</td>
                    <td className="p-3 font-black text-slate-800">{r.percentage}%</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {r.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/results/${r.attemptId}`}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Inspect Result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;
