import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const ExamTimer = ({ formatted, isUrgent }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm tracking-wider border transition-all ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-slate-100 text-slate-800 border-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-slate-500" />
      )}
      <span>{formatted}</span>
    </div>
  );
};
