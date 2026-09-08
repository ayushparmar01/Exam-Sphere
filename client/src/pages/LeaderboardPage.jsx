import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  Award,
  Crown,
  Flame,
  HelpCircle,
  Medal,
  Search,
  ShieldCheck,
  Timer,
  Trophy,
  User,
  Users,
} from 'lucide-react';

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [leaderboardType, setLeaderboardType] = useState('EXAM'); // 'EXAM' | 'GLOBAL'
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch available exams for exam dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams');
        if (res.data && res.data.data && res.data.data.length > 0) {
          setExams(res.data.data);
          const defaultExamId = searchParams.get('examId') || res.data.data[0]._id;
          setSelectedExamId(defaultExamId);
        }
      } catch (err) {
        console.error('Failed to load exams for leaderboard:', err);
      }
    };

    fetchExams();
  }, []);

  // Fetch leaderboard data when examId or type changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let endpoint = '/leaderboard';
        if (leaderboardType === 'EXAM' && selectedExamId) {
          endpoint = `/leaderboard/${selectedExamId}`;
        }

        const res = await api.get(endpoint);
        if (res.data) {
          setLeaderboardData(res.data.leaderboard || []);
          setCurrentUserRank(res.data.currentUserRank || null);
          setTotalParticipants(res.data.totalParticipants || 0);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leaderboardType === 'GLOBAL' || (leaderboardType === 'EXAM' && selectedExamId)) {
      fetchLeaderboard();
    }
  }, [leaderboardType, selectedExamId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200">
              Verified Rankings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Leaderboard & Performance Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deterministic evaluation governed by Score → Accuracy → Time Taken.
          </p>
        </div>

        {/* Global vs Exam-Specific Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setLeaderboardType('EXAM')}
            className={`px-4 py-2 rounded-xl transition ${
              leaderboardType === 'EXAM'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exam Leaderboard
          </button>
          <button
            onClick={() => setLeaderboardType('GLOBAL')}
            className={`px-4 py-2 rounded-xl transition ${
              leaderboardType === 'GLOBAL'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Global Standings
          </button>
        </div>
      </div>

      {/* Tie-Breaker Informational Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Deterministic Tie-Breaking Policy:</p>
          <p className="text-indigo-800 leading-relaxed">
            Rankings are evaluated dynamically across each candidate's <strong>best valid attempt</strong>. If two students attain identical scores, tie-breakers resolve in sequence: (1) Higher Accuracy Rate, then (2) Lower Time Taken.
          </p>
        </div>
      </div>

      {/* Exam Selector Dropdown (if EXAM mode) */}
      {leaderboardType === 'EXAM' && exams.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Select Assessment:</span>
              <span className="text-[11px] text-slate-400">View rankings for a specific examination</span>
            </div>
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none bg-white min-w-[280px]"
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.title} ({ex.subject})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current User Highlight Card if ranked */}
      {currentUserRank && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-sm shadow">
              #{currentUserRank.rank}
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Your Position</p>
              <h4 className="text-sm font-extrabold">{user?.name}</h4>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-right">
            <div>
              <span className="text-[10px] text-indigo-300 block uppercase font-bold">Score</span>
              <span className="font-extrabold text-sm">{currentUserRank.score} pts</span>
            </div>
            {currentUserRank.percentile !== undefined && (
              <div>
                <span className="text-[10px] text-indigo-300 block uppercase font-bold">Percentile</span>
                <span className="font-extrabold text-sm text-emerald-400">{currentUserRank.percentile}%</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-indigo-300 block uppercase font-bold">Accuracy</span>
              <span className="font-extrabold text-sm">{currentUserRank.accuracy}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : leaderboardData.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No attempt records yet"
          description="Be the first candidate to complete this assessment and top the leaderboard!"
          actionText="Take Exam Now"
          actionLink={selectedExamId ? `/exam/${selectedExamId}` : '/exams'}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Accuracy</th>
                  {leaderboardType === 'EXAM' && <th className="py-4 px-6">Time Taken</th>}
                  {leaderboardType === 'EXAM' && <th className="py-4 px-6">Percentile</th>}
                  {leaderboardType === 'GLOBAL' && <th className="py-4 px-6">Tests Taken</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboardData.map((row) => {
                  const isUser = row.isCurrentUser;
                  const rank = row.rank;

                  return (
                    <tr
                      key={row.student?.id || rank}
                      className={`transition ${
                        isUser
                          ? 'bg-indigo-50/70 font-bold text-indigo-950 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-6 font-extrabold text-sm">
                        <div className="flex items-center gap-2">
                          {rank === 1 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-xs">
                              <Crown className="w-4 h-4" />
                            </span>
                          ) : rank === 2 ? (
                            <span className="w-7 h-7 rounded-lg bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs shadow-xs">
                              <Medal className="w-4 h-4" />
                            </span>
                          ) : rank === 3 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              <Medal className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold ml-2">#{rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Candidate Avatar & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              row.student?.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={row.student?.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {row.student?.name}
                              {isUser && (
                                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {row.student?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                        {row.score !== undefined ? `${row.score} pts` : `${row.averageScore}%`}
                      </td>

                      {/* Accuracy */}
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {row.accuracy}%
                      </td>

                      {/* Time Taken (Exam) */}
                      {leaderboardType === 'EXAM' && (
                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                          {Math.floor((row.timeTakenSeconds || 0) / 60)}m {(row.timeTakenSeconds || 0) % 60}s
                        </td>
                      )}

                      {/* Percentile (Exam) */}
                      {leaderboardType === 'EXAM' && (
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                            {row.percentile}%
                          </span>
                        </td>
                      )}

                      {/* Tests Taken (Global) */}
                      {leaderboardType === 'GLOBAL' && (
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {row.testsCompleted} tests
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
