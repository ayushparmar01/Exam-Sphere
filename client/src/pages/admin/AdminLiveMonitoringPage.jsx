import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Search,
  Filter,
  Flag,
  ChevronRight,
  RefreshCw,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function AdminLiveMonitoringPage() {
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    activeCandidates: 0,
    submittedCandidates: 0,
    timedOutCandidates: 0,
    disconnectedCandidates: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    cameraUnavailableCount: 0,
    micUnavailableCount: 0,
  });
  const [candidates, setCandidates] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  const fetchLiveMonitoring = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;

      const res = await api.get('/admin/monitoring/live', { params });
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setCandidates(res.data.data.candidates);
      }
    } catch (err) {
      console.error('Failed to load live monitoring metrics', err);
    } finally {
      setLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    // Fetch exams list for filter dropdown
    api.get('/exams').then((r) => {
      if (r.data.success) setExams(r.data.data);
    }).catch(() => {});

    fetchLiveMonitoring();
  }, [fetchLiveMonitoring]);

  // Real-time Socket.IO subscriptions
  useEffect(() => {
    if (!socket) return;

    // Join admin monitor room
    socket.emit('join_admin_monitor', { examId: selectedExamId });

    // Handle integrity alerts
    const handleIntegrityAlert = (data) => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.attemptId === data.attemptId || c._id === data.attemptId) {
            return {
              ...c,
              integrityRiskScore: data.integrityRiskScore,
              integrityRiskLevel: data.integrityRiskLevel,
              isFlaggedForReview: data.isFlaggedForReview,
              status: data.status,
              cameraStatus: data.cameraStatus || c.cameraStatus,
              microphoneStatus: data.microphoneStatus || c.microphoneStatus,
              connectionStatus: data.connectionStatus || c.connectionStatus,
            };
          }
          return c;
        })
      );

      // Dynamically update metric counts
      setMetrics((prev) => ({
        ...prev,
        highRiskCount: data.integrityRiskLevel === 'HIGH' ? prev.highRiskCount + 1 : prev.highRiskCount,
      }));
    };

    // Handle candidate heartbeat deltas
    const handleHeartbeatDelta = (data) => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.attemptId === data.attemptId || c._id === data.attemptId) {
            return {
              ...c,
              currentQuestionIndex: data.currentQuestionIndex ?? c.currentQuestionIndex,
              answeredCount: data.answeredCount ?? c.answeredCount,
              lastHeartbeat: data.lastHeartbeat,
              connectionStatus: 'CONNECTED',
            };
          }
          return c;
        })
      );
    };

    // Handle candidate progress updates
    const handleProgressDelta = (data) => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.attemptId === data.attemptId || c._id === data.attemptId) {
            return {
              ...c,
              currentQuestionIndex: data.currentQuestionIndex,
              answeredCount: data.answeredCount,
              lastHeartbeat: data.lastActivity,
            };
          }
          return c;
        })
      );
    };

    // Handle candidate status changes (submitted, disconnected, etc.)
    const handleStatusChange = (data) => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.attemptId === data.attemptId || c._id === data.attemptId) {
            return {
              ...c,
              status: data.status,
              connectionStatus: data.connectionStatus || c.connectionStatus,
            };
          }
          return c;
        })
      );
    };

    socket.on('integrity_alert', handleIntegrityAlert);
    socket.on('candidate_heartbeat_delta', handleHeartbeatDelta);
    socket.on('candidate_progress_delta', handleProgressDelta);
    socket.on('candidate_status_change', handleStatusChange);

    return () => {
      socket.off('integrity_alert', handleIntegrityAlert);
      socket.off('candidate_heartbeat_delta', handleHeartbeatDelta);
      socket.off('candidate_progress_delta', handleProgressDelta);
      socket.off('candidate_status_change', handleStatusChange);
    };
  }, [socket, selectedExamId]);

  // Toggle flag status for a candidate
  const handleToggleFlag = async (attemptId, currentFlag) => {
    try {
      const res = await api.patch(`/admin/attempts/${attemptId}/flag`, {
        isFlagged: !currentFlag,
      });
      if (res.data.success) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.attemptId === attemptId || c._id === attemptId
              ? { ...c, isFlaggedForReview: !currentFlag }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle flag', err);
    }
  };

  // Filter candidates locally
  const filteredCandidates = candidates.filter((c) => {
    const studentName = c.student?.name || '';
    const studentEmail = c.student?.email || '';
    const examTitle = c.exam?.title || '';

    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      examTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = !selectedRiskLevel || c.integrityRiskLevel === selectedRiskLevel;
    const matchesStatus = !selectedStatus || c.status === selectedStatus;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Live Exam Proctoring Command Center</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time candidate telemetry, integrity risk scores, device monitoring & active session supervision.
          </p>
        </div>

        <button
          onClick={fetchLiveMonitoring}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition border border-slate-700 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Candidates</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.totalCandidates}</p>
          <span className="text-[11px] text-slate-500">Across all sessions</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase">
            <span>Active Live</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{metrics.activeCandidates}</p>
          <span className="text-[11px] text-slate-500">Currently taking tests</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.submittedCandidates}</p>
          <span className="text-[11px] text-slate-500">Completed & scored</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase">
            <span>High Risk Flagged</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-400">{metrics.highRiskCount}</p>
          <span className="text-[11px] text-rose-400/80 font-medium">Requires supervisor review</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase">
            <span>Medium Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-400">{metrics.mediumRiskCount}</p>
          <span className="text-[11px] text-slate-500">Multiple integrity signals</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, email, or exam title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.title}
              </option>
            ))}
          </select>

          <select
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">Active (In Progress)</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TIMED_OUT">Timed Out</option>
          </select>
        </div>
      </div>

      {/* Candidate Monitoring Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Exam</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Remaining</th>
                <th className="px-4 py-3.5">Progress</th>
                <th className="px-4 py-3.5">Integrity Risk</th>
                <th className="px-4 py-3.5 text-center">Devices</th>
                <th className="px-4 py-3.5">Last Signal</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No active or monitored exam attempts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const minutesLeft = Math.floor((c.remainingSeconds || 0) / 60);
                  const secondsLeft = (c.remainingSeconds || 0) % 60;
                  const progressPercent =
                    c.totalQuestions > 0 ? Math.round(((c.answeredCount || 0) / c.totalQuestions) * 100) : 0;

                  return (
                    <tr
                      key={c._id || c.attemptId}
                      className={`hover:bg-slate-800/40 transition ${
                        c.isFlaggedForReview ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Candidate */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {c.student?.name ? c.student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {c.student?.name || 'Candidate'}
                              {c.isFlaggedForReview && (
                                <Flag className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{c.student?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Exam */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-200">{c.exam?.title || 'Exam'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.status === 'IN_PROGRESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                              : c.status === 'SUBMITTED'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.status === 'IN_PROGRESS' ? 'Live Testing' : c.status}
                        </span>
                      </td>

                      {/* Remaining Time */}
                      <td className="px-4 py-4 font-mono text-xs">
                        {c.status === 'IN_PROGRESS' ? (
                          <span
                            className={
                              minutesLeft < 5
                                ? 'text-rose-400 font-bold'
                                : minutesLeft < 10
                                ? 'text-amber-400 font-medium'
                                : 'text-slate-300'
                            }
                          >
                            {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                            <span>
                              {c.answeredCount || 0}/{c.totalQuestions || 0}
                            </span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Integrity Risk */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                              c.integrityRiskLevel === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : c.integrityRiskLevel === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {c.integrityRiskLevel} ({c.integrityRiskScore || 0} pts)
                          </span>
                        </div>
                      </td>

                      {/* Devices */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {c.cameraStatus === 'ACTIVE' ? (
                            <Camera className="w-4 h-4 text-emerald-400" title="Camera Active" />
                          ) : c.cameraStatus === 'UNAVAILABLE' || c.cameraStatus === 'PERMISSION_DENIED' ? (
                            <CameraOff className="w-4 h-4 text-rose-400" title="Camera Unavailable" />
                          ) : (
                            <Camera className="w-4 h-4 text-slate-600" title="Camera Not Required" />
                          )}

                          {c.microphoneStatus === 'ACTIVE' ? (
                            <Mic className="w-4 h-4 text-cyan-400" title="Mic Active" />
                          ) : c.microphoneStatus === 'UNAVAILABLE' || c.microphoneStatus === 'PERMISSION_DENIED' ? (
                            <MicOff className="w-4 h-4 text-rose-400" title="Mic Unavailable" />
                          ) : (
                            <Mic className="w-4 h-4 text-slate-600" title="Mic Not Required" />
                          )}

                          {c.connectionStatus === 'CONNECTED' ? (
                            <Wifi className="w-4 h-4 text-blue-400" title="Online" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" title="Disconnected" />
                          )}
                        </div>
                      </td>

                      {/* Last Signal */}
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {c.lastHeartbeat ? new Date(c.lastHeartbeat).toLocaleTimeString() : 'Just now'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleFlag(c._id || c.attemptId, c.isFlaggedForReview)}
                            className={`p-1.5 rounded-lg border transition ${
                              c.isFlaggedForReview
                                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title={c.isFlaggedForReview ? 'Remove Flag' : 'Flag for Review'}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/admin/attempts/${c._id || c.attemptId}/monitoring`}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-indigo-500/30"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
