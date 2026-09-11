import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminCollegeAnalyticsPage = () => {
  const { user } = useAuth();
  const [collegeStats, setCollegeStats] = useState(null);
  const [yearAnalytics, setYearAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cross-section filter
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState(3);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  useEffect(() => {
    fetchCollegeData();
  }, []);

  useEffect(() => {
    fetchYearData(selectedDept, selectedYear);
  }, [selectedDept, selectedYear]);

  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/analytics/college');
      if (res.data?.analytics) {
        setCollegeStats(res.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching college analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearData = async (dept, yr) => {
    try {
      setSectionsLoading(true);
      const res = await api.get(`/academic/analytics/year?department=${dept}&year=${yr}`);
      if (res.data?.analytics) {
        setYearAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching year analytics:', err);
    } finally {
      setSectionsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-600" />
          College-Wide Academic Performance Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Comprehensive institutional benchmark across academic departments, cohorts, and section performance trajectories.
        </p>
      </div>

      {/* High-Level Institutional Stats */}
      {collegeStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Students</p>
            <p className="text-2xl font-black text-slate-900">{collegeStats.totalStudents || 0}</p>
            <p className="text-[11px] text-indigo-600 font-semibold">Active Enrollment</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Faculty Members</p>
            <p className="text-2xl font-black text-slate-900">{collegeStats.totalTeachers || 0}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Approved Instructors</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Published Exams</p>
            <p className="text-2xl font-black text-slate-900">{collegeStats.totalExams || 0}</p>
            <p className="text-[11px] text-purple-600 font-semibold">Evaluation Cycles</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Attempts</p>
            <p className="text-2xl font-black text-slate-900">{collegeStats.totalAttempts || 0}</p>
            <p className="text-[11px] text-blue-600 font-semibold">Test Submissions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">College Avg Score</p>
            <p className="text-2xl font-black text-indigo-600">{collegeStats.overallAverageScore || 0}%</p>
            <p className="text-[11px] text-slate-500 font-medium">Standardized Benchmark</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Overall Pass Rate</p>
            <p className="text-2xl font-black text-emerald-600">{collegeStats.overallPassRate || 0}%</p>
            <p className="text-[11px] text-slate-500 font-medium">Clearance Benchmark</p>
          </div>
        </div>
      )}

      {/* Cross-Section Comparison Module */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Cross-Section Cohort Comparison (Section A vs B vs C)
            </h2>
            <p className="text-xs text-slate-400">Compare average scores and pass rates between parallel sections</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>
        </div>

        {sectionsLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading cross-section data...</div>
        ) : !yearAnalytics || !yearAnalytics.sections || yearAnalytics.sections.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No sections recorded for {selectedDept} Year {selectedYear}.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearAnalytics.sections.map((s) => ({
                  name: `Sec ${s.sectionName}`,
                  averageScore: s.averageScore,
                  passRate: s.passRate,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
                  <Legend />
                  <Bar dataKey="averageScore" name="Average Score %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4">Enrolled Students</th>
                    <th className="py-3 px-4">Active Test Takers</th>
                    <th className="py-3 px-4">Average Score</th>
                    <th className="py-3 px-4">Pass Rate</th>
                    <th className="py-3 px-4 text-right">Performance Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {yearAnalytics.sections.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        Section {s.sectionName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {s.totalStudents}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {s.attemptedCount}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600">
                        {s.averageScore}%
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {s.passRate}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.averageScore >= 70
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.averageScore >= 50
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.averageScore >= 70 ? 'ADVANCED' : s.averageScore >= 50 ? 'STANDARD' : 'NEEDS SUPPORT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
