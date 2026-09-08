import React from 'react';
import { Bookmark, CheckCircle2, Circle, HelpCircle } from 'lucide-react';

export const QuestionPalette = ({
  questions = [],
  answers = [],
  currentIndex = 0,
  onSelectIndex,
}) => {
  // Map answers by questionId
  const answerMap = new Map();
  answers.forEach((ans) => {
    answerMap.set(ans.questionId, ans);
  });

  const getStatus = (qId) => {
    const ans = answerMap.get(qId);
    if (!ans || !ans.visited) return 'not_visited';
    if (ans.markedForReview) return 'marked';
    if (ans.selectedOption !== null && ans.selectedOption !== undefined) return 'answered';
    return 'not_answered';
  };

  const statusCounts = {
    answered: 0,
    marked: 0,
    not_answered: 0,
    not_visited: 0,
  };

  questions.forEach((q) => {
    const status = getStatus(q.questionId);
    statusCounts[status]++;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-full">
      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
        <span>Question Palette</span>
        <span className="text-xs text-slate-500 font-normal">
          {questions.length} Questions
        </span>
      </h4>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px]">
            {statusCounts.answered}
          </span>
          <span className="text-slate-600">Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-500 text-white flex items-center justify-center font-bold text-[9px]">
            {statusCounts.marked}
          </span>
          <span className="text-slate-600">Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-[9px]">
            {statusCounts.not_answered}
          </span>
          <span className="text-slate-600">Not Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px]">
            {statusCounts.not_visited}
          </span>
          <span className="text-slate-600">Not Visited</span>
        </div>
      </div>

      {/* Question Number Matrix */}
      <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-72 p-1">
        {questions.map((q, idx) => {
          const status = getStatus(q.questionId);
          const isCurrent = currentIndex === idx;

          let colorClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
          if (status === 'answered') {
            colorClass = 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200';
          } else if (status === 'marked') {
            colorClass = 'bg-purple-600 text-white border-purple-700 shadow-sm shadow-purple-200';
          } else if (status === 'not_answered') {
            colorClass = 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200';
          }

          return (
            <button
              key={q.questionId}
              onClick={() => onSelectIndex(idx)}
              className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center border transition-all ${colorClass} ${
                isCurrent ? 'ring-2 ring-offset-1 ring-indigo-600 font-extrabold scale-105' : ''
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
