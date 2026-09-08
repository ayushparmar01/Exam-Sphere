import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Filter,
  HelpCircle,
  Lightbulb,
  Search,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';

export const MistakeAnalysisPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('All');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/student');
        if (res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load mistake analysis:', err);
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
        <CardSkeleton count={3} />
      </div>
    );
  }

  const weakAreas = analytics?.weakAreas || [];
  const strongAreas = analytics?.strongAreas || [];
  const mistakes = analytics?.mistakeAnalysis || [];

  const topicsList = ['All', ...new Set(mistakes.map((m) => m.topic))];
  const filteredMistakes = selectedTopic === 'All'
    ? mistakes
    : mistakes.filter((m) => m.topic === selectedTopic);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider">
            Targeted Revision
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-semibold">{mistakes.length} Questions Logged</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Mistake Analysis & Weak Area Diagnostic
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Review incorrect answers aggregated across all your past assessments. Analyze conceptual errors to ensure mastery before taking your next exam.
        </p>
      </div>

      {/* Weak Areas vs Strong Areas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Priority Weak Areas (Low Accuracy)
            </h3>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
              Revision Required
            </span>
          </div>

          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((w, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{w.topic}</h4>
                    <p className="text-[11px] text-slate-500">{w.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-600 block">{w.accuracy}%</span>
                    <span className="text-[10px] text-slate-400 font-medium">{w.incorrectCount || 0} missed</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No low-accuracy topics detected. Keep maintaining your retention!
            </p>
          )}
        </div>

        {/* Strong Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mastered Areas (High Accuracy)
            </h3>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Solid Concept Retention
            </span>
          </div>

          {strongAreas.length > 0 ? (
            <div className="space-y-3">
              {strongAreas.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.topic}</h4>
                    <p className="text-[11px] text-slate-500">{s.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600 block">{s.accuracy}%</span>
                    <span className="text-[10px] text-slate-400 font-medium">Mastered</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Complete more assessments to reveal your top mastery domains.
            </p>
          )}
        </div>
      </div>

      {/* Filter by Topic Strip */}
      {topicsList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Topic:
          </span>
          {topicsList.map((top) => (
            <button
              key={top}
              onClick={() => setSelectedTopic(top)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                selectedTopic === top
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {top}
            </button>
          ))}
        </div>
      )}

      {/* Mistakes Item Feed */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Historical Missed Questions</h3>

        {filteredMistakes.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Zero mistakes logged!"
            description="You have no recorded errors for this topic. Great job maintaining precision."
            actionText="Take a Practice Exam"
            actionLink="/exams"
          />
        ) : (
          <div className="space-y-4">
            {filteredMistakes.map((m, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {m.subject}
                    </span>
                    <span className="text-slate-600 font-semibold">{m.topic}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{m.examTitle}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(m.date).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {m.questionText}
                </h4>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                      Your Selected Answer:
                    </span>
                    <p className="font-semibold">{m.selectedOption || 'Skipped'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                      Correct Key:
                    </span>
                    <p className="font-semibold">{m.correctAnswer}</p>
                  </div>
                </div>

                {/* Explanation */}
                {m.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Explanation:
                    </span>
                    <p className="leading-relaxed">{m.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
