import React from 'react';
import { AlertCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning', // 'warning' | 'danger' | 'info'
  unansweredCount = null,
  markedCount = null,
  totalQuestions = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all">
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              type === 'danger'
                ? 'bg-rose-100 text-rose-600'
                : type === 'warning'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            {type === 'danger' ? (
              <AlertCircle className="w-6 h-6" />
            ) : type === 'warning' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{message}</p>

        {/* Unanswered / Marked Summary Badge */}
        {unansweredCount !== null && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Questions:</span>
              <span className="font-bold text-slate-800">{totalQuestions}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Unanswered Questions:</span>
              <span
                className={`font-bold ${
                  unansweredCount > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'
                }`}
              >
                {unansweredCount}
              </span>
            </div>
            {markedCount !== null && markedCount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-600">{markedCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition shadow-sm ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
