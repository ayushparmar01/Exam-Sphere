import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { CardSkeleton, TableSkeleton } from '../../components/SkeletonLoader';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  PlusCircle,
  Shield,
  Sparkles,
  Upload,
  Users,
  Target,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/admin');
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const passFail = data?.passFailDistribution || [];
  const recentAttempts = data?.recentAttempts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
              Administration Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Examiner Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor candidate participation, author questions, schedule assessments, and audit examination integrity.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/exams/create"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-200"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Exam</span>
          </Link>
          <Link
            to="/admin/questions"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Bank</span>
          </Link>
          <Link
            to="/admin/questions/upload"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk CSV</span>
          </Link>
          <Link
            to="/admin/ai-generator"
            className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Generator</span>
          </Link>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={kpis.totalStudents || 0}
          subtitle="Registered accounts"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Exams"
          value={kpis.totalExams || 0}
          subtitle="Catalog assessments"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Active Exams"
          value={kpis.activeExams || 0}
          subtitle="Live for taking"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Attempts Made"
          value={kpis.totalAttempts || 0}
          subtitle="Completed / Active"
          icon={FileCheck}
          color="amber"
        />
        <StatCard
          title="Average Score"
          value={`${kpis.avgScore || 0}%`}
          subtitle="Candidate average"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Pass Rate"
          value={`${kpis.passRate || 0}%`}
          subtitle="Standard benchmark"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pass / Fail Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pass / Fail Outcome Ratio</h3>
            <p className="text-xs text-slate-400">Distribution across all completed attempts</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFail}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passFail.map((entry, index) => (
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

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
            {kpis.completedAttempts || 0} completed candidate evaluation sessions
          </div>
        </div>

        {/* Quick Management Links & Status */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Administrative Operational Hub</h3>
              <p className="text-xs text-slate-400">Core examination configuration and telemetry</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Audit Logs →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              to="/admin/questions"
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Question Bank Management</h4>
              <p className="text-xs text-slate-500">
                Author, categorize, edit, and version MCQs across DSA, DBMS, and OS.
              </p>
            </Link>

            <Link
              to="/admin/exams"
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Exam Scheduling & Rules</h4>
              <p className="text-xs text-slate-500">
                Set duration, passing scores, negative marking rules, and publish status.
              </p>
            </Link>

            <Link
              to="/admin/attempts"
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Attempt Auditing & Telemetry</h4>
              <p className="text-xs text-slate-500">
                Inspect active sessions, candidate scores, and window blur/tab switch flags.
              </p>
            </Link>

            <Link
              to="/admin/ai-generator"
              className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 hover:bg-purple-100/50 transition space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-purple-950">AI Question Synthesizer</h4>
              <p className="text-xs text-purple-800">
                Generate high-concept questions into Pending Review queue for approval.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Attempts Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Candidate Submissions</h3>
            <p className="text-xs text-slate-400">Live attempt records and scores</p>
          </div>
          <Link to="/admin/attempts" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All Attempts →
          </Link>
        </div>

        {recentAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentAttempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            att.studentId?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={att.studentId?.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {att.studentId?.name || 'Candidate'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {att.studentId?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{att.examId?.title || 'Exam'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'SUBMITTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : att.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(att.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">No recent submissions.</div>
        )}
      </div>
    </div>
  );
};
