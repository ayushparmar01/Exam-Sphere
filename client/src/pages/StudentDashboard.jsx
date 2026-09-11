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
  Download,
  FileText,
  Folder,
  Send,
  Star,
  User,
  Layers,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Filter,
  Check,
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
  const [activeTab, setActiveTab] = useState('overview'); // overview, exams, assignments, materials, announcements

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Submission modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState('');

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('COURSE');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Filtering for materials
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, examsRes, resultsRes, assignmentsRes, materialsRes, announcementsRes] = await Promise.all([
        api.get('/analytics/student').catch(() => ({ data: {} })),
        api.get('/exams?limit=6').catch(() => ({ data: { data: [] } })),
        api.get('/results/my-results?limit=5').catch(() => ({ data: { data: [] } })),
        api.get('/assignments/my').catch(() => ({ data: { assignments: [] } })),
        api.get('/materials').catch(() => ({ data: { groupedMaterials: [] } })),
        api.get('/announcements/feed').catch(() => ({ data: { announcements: [] } })),
      ]);

      if (analyticsRes.data) setDashboardData(analyticsRes.data);
      if (examsRes.data?.data) setUpcomingExams(examsRes.data.data);
      if (resultsRes.data?.data) setRecentResults(resultsRes.data.data);
      if (assignmentsRes.data?.assignments) setAssignments(assignmentsRes.data.assignments);
      if (materialsRes.data?.groupedMaterials) setMaterials(materialsRes.data.groupedMaterials);
      if (announcementsRes.data?.announcements) setAnnouncements(announcementsRes.data.announcements);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() || !selectedAssignment) return;
    try {
      setSubmissionLoading(true);
      await api.post(`/assignments/${selectedAssignment._id}/submit`, {
        submissionText,
      });
      setSubmissionSuccess('Assignment submitted successfully!');
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionText('');
        setSubmissionSuccess('');
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting assignment');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    try {
      setFeedbackLoading(true);
      await api.post('/feedback', {
        category: feedbackCategory,
        subject: feedbackSubject || undefined,
        rating: feedbackRating,
        message: feedbackMessage,
      });
      setFeedbackSuccess('Feedback submitted successfully. Thank you!');
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackMessage('');
        setFeedbackSuccess('');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDownloadProgressPDF = async () => {
    try {
      const studentId = user?._id || user?.id;
      const res = await api.get(`/reports/student/${studentId}/progress-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Student_Progress_${user?.rollNumber || 'Report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Could not download progress report PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const summary = dashboardData?.summary || user?.stats || {};
  const scoreTrend = dashboardData?.scoreTrend || [];
  const subjectPerformance = dashboardData?.subjectPerformance || [];
  const weakAreas = dashboardData?.weakAreas || [];

  // Filter study materials by subject
  const filteredMaterials = selectedSubject === 'ALL'
    ? materials
    : materials.filter((m) => m._id === selectedSubject);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Academic Space Institutional Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold tracking-wider uppercase border border-indigo-100">
              Institutional Academic Space
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
              AY {user?.academicYear || '2025-2026'}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {user?.name || 'Alex Rivera'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Roll No: <span className="font-semibold text-slate-700">{user?.rollNumber || '2101330100042'}</span> • Department of {user?.department || 'CSE'}
            </p>
          </div>

          {/* Academic Placement Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
              <span className="text-slate-400 font-normal mr-1">Program:</span> {user?.program || 'B.Tech'}
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
              <span className="text-slate-400 font-normal mr-1">Year:</span> {user?.year || 3}rd Year
            </div>
            <div className="px-3 py-1 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-800 font-bold">
              <span className="text-indigo-400 font-normal mr-1">Section:</span> Section {user?.section || 'A'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadProgressPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Progress PDF
          </button>
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            Submit Feedback
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Overview & Progress
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exams'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Assigned Assessments
          {upcomingExams.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
              {upcomingExams.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments & Tasks
          {assignments.filter((a) => !a.submission).length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {assignments.filter((a) => !a.submission).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Folder className="w-4 h-4" />
          Study Materials by Unit
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Announcements & Notices
          {announcements.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-800 font-bold">
              {announcements.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
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
              subtitle="Section Benchmark"
              icon={Award}
              color="indigo"
            />
          </div>

          {/* Charts & Diagnostic Alerts */}
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

            {/* Subject Performance & Needs Revision */}
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

              {/* Needs Revision Diagnostic Detection (Accuracy < 60%) */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Needs Revision Diagnostic (Accuracy &lt; 60%)
                </h4>
                {weakAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {weakAreas.map((w, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100"
                      >
                        <span>{w.topic}</span>
                        <span className="text-[10px] opacity-80 font-bold">({w.accuracy}%)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No critical weak topics detected. Maintain your revision!</p>
                )}
              </div>
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
      )}

      {/* TAB 2: ASSIGNED EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Targeted Examinations</h2>
              <p className="text-xs text-slate-500">Exams published for your Section {user?.section || 'A'}, Year {user?.year || 3}, and College</p>
            </div>
            <Link
              to="/exams"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start"
            >
              <Play className="w-3.5 h-3.5" />
              Browse All Assessments
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <span className="text-[11px] font-semibold text-slate-500">
                      Scope: {exam.targetScope || 'COLLEGE'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {exam.description || 'Comprehensive multiple-choice assessment designed for institutional mastery retention.'}
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
                    <span>View Exam & Guidelines</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Assignments & Tasks</h2>
              <p className="text-xs text-slate-500">Coursework deliverables assigned by your teachers</p>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              No assignments currently active for your section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((asg) => {
                const isSubmitted = !!asg.submission;
                const isGraded = asg.submission?.status === 'GRADED';
                const dueDate = new Date(asg.dueDate);
                const isOverdue = dueDate < new Date() && !isSubmitted;

                return (
                  <div
                    key={asg._id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                          {asg.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isGraded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isSubmitted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isGraded
                            ? `GRADED: ${asg.submission.marksObtained}/${asg.maxMarks}`
                            : isSubmitted
                            ? 'SUBMITTED'
                            : isOverdue
                            ? 'OVERDUE'
                            : 'PENDING'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {asg.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Due: {dueDate.toLocaleDateString()}</span>
                        <span>Max Marks: {asg.maxMarks}</span>
                      </div>

                      {/* Teacher Feedback if graded */}
                      {isGraded && asg.submission.feedback && (
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                          <p className="font-bold text-emerald-900 mb-0.5">Teacher Feedback:</p>
                          <p className="text-emerald-800">{asg.submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isSubmitted ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                          <Check className="w-4 h-4" />
                          <span>Submitted on {new Date(asg.submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAssignment(asg);
                            setSubmissionText('');
                          }}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit Assignment Work
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Study Materials & Lecture Notes</h2>
              <p className="text-xs text-slate-500">Hierarchically organized by Subject and Units</p>
            </div>

            {/* Subject filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Subjects</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>{m._id}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              No study notes currently published for your department & year.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredMaterials.map((subjectGroup) => (
                <div key={subjectGroup._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      {subjectGroup._id}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {subjectGroup.units?.length || 0} Units Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectGroup.units?.map((unitGroup) => (
                      <div
                        key={unitGroup.unit}
                        className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                            {unitGroup.unit}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {unitGroup.materials?.length} resources
                          </span>
                        </div>

                        <div className="space-y-2">
                          {unitGroup.materials?.map((item) => (
                            <div
                              key={item._id}
                              className="bg-white p-3 rounded-lg border border-slate-200/80 hover:border-indigo-300 transition space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</p>
                                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {item.fileType || 'PDF'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2">{item.topic || item.description}</p>
                              
                              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{(item.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                                <a
                                  href={`http://localhost:5000/api/materials/${item._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Institutional Announcements & Circulars</h2>
            <p className="text-xs text-slate-500">Official academic notifications from department heads & administration</p>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              No recent notifications to display.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ann.priority === 'HIGH' || ann.priority === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ann.priority} PRIORITY
                      </span>
                      <span className="text-xs text-slate-400">
                        Scope: {ann.scope}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{ann.message}</p>
                  </div>

                  <div className="text-xs text-slate-400 font-medium md:text-right whitespace-nowrap">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Assignment Deliverable</h3>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedAssignment.title}</p>
              <p className="text-slate-500">{selectedAssignment.subject} • Max Marks: {selectedAssignment.maxMarks}</p>
              {selectedAssignment.instructions && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 mt-2">
                  <span className="font-bold">Instructions:</span> {selectedAssignment.instructions}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Notes / Code Repository Links / Report Text:
                </label>
                <textarea
                  rows={5}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your report summary, repository links, or execution walkthrough here..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {submissionSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {submissionSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {submissionLoading ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Academic Feedback</h3>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Category:</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="COURSE">Course & Lecture Content</option>
                  <option value="EXAM">Examination Quality / Assessment</option>
                  <option value="FACILITY">Technical & System Performance</option>
                  <option value="GENERAL">General Suggestion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 text-amber-400 focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= feedbackRating ? 'fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 font-bold ml-2">
                    {feedbackRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message / Constructive Suggestion:</label>
                <textarea
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Share your specific thoughts, clarity of exam questions, or recommendations..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {feedbackSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold">
                  {feedbackSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
