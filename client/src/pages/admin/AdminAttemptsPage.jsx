import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import {
  AlertTriangle,
  Clock,
  Eye,
  FileCheck,
  Shield,
  ShieldAlert,
  User,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const AdminAttemptsPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [integrityEvents, setIntegrityEvents] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/attempts?page=${page}&limit=15`);
      if (res.data && res.data.data) {
        setAttempts(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [page]);

  const handleInspectAttempt = async (attempt) => {
    setSelectedAttempt(attempt);
    try {
      setLoadingDetails(true);
      const res = await api.get(`/admin/attempts/${attempt._id}`);
      if (res.data && res.data.data) {
        setIntegrityEvents(res.data.data.integrityEvents || []);
      }
    } catch (err) {
      console.error('Failed to load integrity details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            Candidate Audit
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Examination Attempts & Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review active sessions, completion scores, and audited integrity telemetry (window blur, tab switches).
        </p>
      </div>

      {/* Attempts Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : attempts.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No attempt records found"
          description="Student assessment submissions will appear here once exams begin."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Assessment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Time Spent</th>
                  <th className="py-3.5 px-4">Integrity Flags</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
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
                            {att.studentId?.name || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {att.studentId?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {att.examId?.title || 'Exam'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {Math.floor((att.timeSpentSeconds || 0) / 60)}m {(att.timeSpentSeconds || 0) % 60}s
                    </td>
                    <td className="py-3.5 px-4">
                      {att.integrityEventCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          {att.integrityEventCount} events
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(att.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectAttempt(att)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-indigo-600 font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attempt Integrity Audit</h3>
                <p className="text-xs text-slate-400">
                  {selectedAttempt.studentId?.name} • {selectedAttempt.examId?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Recorded Integrity Timeline
              </h4>

              {loadingDetails ? (
                <div className="py-6 text-center text-slate-400">Loading telemetry...</div>
              ) : integrityEvents.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold">Zero Suspicious Activity</p>
                  <p className="text-[11px] text-emerald-700">The candidate remained focused inside the active test window throughout the session.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {integrityEvents.map((evt, idx) => (
                    <div
                      key={evt._id || idx}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-amber-950 block">{evt.eventType}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Logged</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
