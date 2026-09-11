import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Star,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const TeacherFeedbackPage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback');
      if (res.data?.feedback) {
        setFeedbacks(res.data.feedback);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = categoryFilter === 'ALL'
    ? feedbacks
    : feedbacks.filter((f) => f.category === categoryFilter);

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Student Academic Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Review qualitative student responses, concept clarity ratings, and exam assessment feedback.
          </p>
        </div>

        {/* Aggregate KPI */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-xl font-black text-slate-900">{averageRating}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold border-l border-slate-200 pl-3">
            <span>Overall Score</span>
            <p className="text-slate-400 font-normal">({feedbacks.length} ratings)</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="COURSE">Course & Lecture Content</option>
            <option value="EXAM">Exam Quality</option>
            <option value="FACILITY">Technical / System</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing {filteredFeedback.length} responses
        </span>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading feedback responses...</div>
      ) : filteredFeedback.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No feedback entries recorded for the selected category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedback.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= item.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {item.subject && (
                  <p className="text-xs font-bold text-slate-900">{item.subject}</p>
                )}

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{item.message}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>
                  {item.isAnonymous ? 'Anonymous Student' : (item.studentId?.name || 'Enrolled Student')}
                </span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
