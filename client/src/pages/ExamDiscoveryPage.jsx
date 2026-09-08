import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  BookOpen,
  Calendar,
  Clock,
  Filter,
  Layers,
  Play,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const ExamDiscoveryPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const subjects = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'AI Fundamentals'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);

      const res = await api.get(`/exams?${params.toString()}`);
      if (res.data && res.data.data) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchExams();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, selectedSubject, selectedDifficulty]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
            Assessment Catalog
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Explore Certified Mock Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Test yourself in realistic, timed conditions across computer science, software architecture, databases, and algorithms.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assessment title..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none bg-white font-medium text-slate-700"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  Subject: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none bg-white font-medium text-slate-700"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  Difficulty: {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No assessments match criteria"
          description="Try broadening your subject filter or search query."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedSubject('All');
            setSelectedDifficulty('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {exam.subject}
                  </span>
                  <div className="flex items-center gap-2">
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
                    {exam.computedStatus && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          exam.computedStatus === 'LIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exam.computedStatus === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {exam.computedStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.description || 'Structured timed exam designed to test core domain competencies.'}
                </p>

                {/* Specs */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Duration</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.duration}m
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Questions</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {exam.questions?.length || 0} MCQs
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Marks</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {exam.totalMarks || 10} pts
                    </span>
                  </div>
                </div>

                {/* User Attempt Status Badge if logged in */}
                {exam.userAttemptsCount !== undefined && (
                  <div className="pt-2 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    {exam.hasActiveSession ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" /> In Progress Attempt Active
                      </span>
                    ) : exam.userAttemptsCount > 0 ? (
                      <span className="text-slate-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Attempts: {exam.userAttemptsCount}/{exam.maximumAttempts || 1}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Attempted Yet</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link
                  to={`/exam/${exam._id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>View Details & Instructions</span>
                  <Play className="w-3 h-3 fill-white" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
