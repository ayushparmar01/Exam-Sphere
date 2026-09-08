import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const SchedulePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await api.get('/schedule');
        if (res.data && res.data.data) {
          setEvents(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            Examination Calendar
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Assessment Schedule & Timelines
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Stay organized with certified exam windows, upcoming assessments, and completed evaluations.
        </p>
      </div>

      {/* Timeline Events List */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No scheduled assessments"
          description="There are currently no active or upcoming assessments scheduled on the calendar."
          actionText="Browse Available Assessments"
          actionLink="/exams"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isLive = event.scheduleStatus === 'LIVE';
            const isCompleted = event.scheduleStatus === 'COMPLETED';
            const isInProgress = event.scheduleStatus === 'IN_PROGRESS';
            const isUpcoming = event.scheduleStatus === 'UPCOMING';

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                {/* Event Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                      {event.subject}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-600">{event.difficulty}</span>
                    <span className="text-slate-400">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.scheduleStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{event.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      Starts: {new Date(event.startTime).toLocaleDateString()} at{' '}
                      {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {event.duration} mins
                    </span>
                    <span>{event.questionsCount} Questions</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isInProgress ? (
                    <Link
                      to={`/exam/${event.id}`}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resume Attempt</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/exam/${event.id}`}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>View Specifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
