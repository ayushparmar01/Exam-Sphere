import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Layers,
  Flag,
  CheckCircle,
  Camera,
  Mic,
  Maximize,
  Copy,
  Wifi,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCandidateDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/attempts/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch candidate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleToggleFlag = async () => {
    if (!data?.attempt) return;
    try {
      const isCurrentlyFlagged = !!data.attempt.isFlaggedForReview;
      const res = await api.patch(`/admin/attempts/${id}/flag`, {
        isFlagged: !isCurrentlyFlagged,
      });
      if (res.data.success) {
        setData((prev) => ({
          ...prev,
          attempt: {
            ...prev.attempt,
            isFlaggedForReview: !isCurrentlyFlagged,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to toggle flag', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="max-w-2xl mx-auto text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">{error || 'Candidate attempt not found'}</h2>
          <Link
            to="/admin/monitoring"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Live Monitoring
          </Link>
        </div>
      </div>
    );
  }

  const { attempt, integrityEvents } = data;
  const student = attempt.studentId;
  const exam = attempt.examId;
  const summary = attempt.proctoringSummary || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/monitoring"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Live Monitoring
        </Link>

        <button
          onClick={handleToggleFlag}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition border ${
            attempt.isFlaggedForReview
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Flag className={`w-4 h-4 ${attempt.isFlaggedForReview ? 'fill-rose-400 text-rose-400' : ''}`} />
          {attempt.isFlaggedForReview ? 'Flagged for Review (Click to Clear)' : 'Flag Candidate for Review'}
        </button>
      </div>

      {/* Candidate Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
              {student?.name ? student.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{student?.name || 'Candidate'}</h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono ${
                    attempt.integrityRiskLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : attempt.integrityRiskLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {attempt.integrityRiskLevel} RISK ({attempt.integrityRiskScore || 0} PTS)
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{student?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div>
              <span className="block text-xs uppercase font-semibold text-slate-500">Examination</span>
              <span className="text-white font-medium">{exam?.title}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="block text-xs uppercase font-semibold text-slate-500">Attempt #</span>
              <span className="text-white font-medium">{attempt.attemptNumber || 1}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="block text-xs uppercase font-semibold text-slate-500">Status</span>
              <span
                className={`font-semibold ${
                  attempt.status === 'IN_PROGRESS'
                    ? 'text-emerald-400'
                    : attempt.status === 'SUBMITTED'
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}
              >
                {attempt.status}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="block text-xs uppercase font-semibold text-slate-500">Started At</span>
              <span className="text-white font-medium">
                {new Date(attempt.startedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Tab Switches
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.tabSwitches || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5 text-purple-400" /> Fullscreen Exits
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.fullscreenExits || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-amber-400" /> Copy/Paste
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.copyPasteAttempts || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" /> Camera Signals
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.cameraEvents || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-cyan-400" /> Acoustic Signals
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.microphoneEvents || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-blue-400" /> Reconnects
          </span>
          <p className="text-2xl font-bold mt-2 text-white">{summary.reconnects || 0}</p>
        </div>
      </div>

      {/* Chronological Event Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Chronological Integrity Telemetry Stream</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {integrityEvents.length} Total Telemetry Signals Logged
          </span>
        </div>

        {integrityEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
            <p className="font-semibold text-slate-400">Zero Integrity Anomalies Detected</p>
            <p className="text-xs mt-1">This candidate maintained full window focus and compliant test conditions.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-6">
            {integrityEvents.map((ev) => {
              const date = new Date(ev.timestamp);
              const timeStr = date.toLocaleTimeString();

              const badgeColors = {
                HIGH: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                LOW: 'bg-slate-800 text-slate-400 border-slate-700',
              };

              return (
                <div key={ev._id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      ev.severity === 'HIGH'
                        ? 'bg-rose-500 ring-4 ring-rose-500/20'
                        : ev.severity === 'MEDIUM'
                        ? 'bg-amber-500 ring-4 ring-amber-500/20'
                        : 'bg-slate-500'
                    }`}
                  />

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{timeStr}</span>
                        <span className="font-bold text-sm text-white">{ev.eventType}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            badgeColors[ev.severity] || badgeColors.LOW
                          }`}
                        >
                          {ev.severity} ({ev.riskPoints > 0 ? `+${ev.riskPoints} pts` : '0 pts'})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {date.toLocaleDateString()}
                      </span>
                    </div>

                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <p className="text-xs text-slate-400 mt-1 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
                        Metadata: {JSON.stringify(ev.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
