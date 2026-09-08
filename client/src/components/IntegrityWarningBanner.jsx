import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, X } from 'lucide-react';

export default function IntegrityWarningBanner({
  riskLevel = 'LOW',
  riskScore = 0,
  message,
  onDismiss,
}) {
  if (!riskLevel || riskScore === 0) return null;

  const configs = {
    LOW: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
      defaultMsg: 'Integrity notice recorded.',
      title: 'Integrity Notice',
    },
    MEDIUM: {
      bg: 'bg-orange-500/15 border-orange-500/40 text-orange-200',
      icon: <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />,
      defaultMsg: 'Repeated integrity events detected. Your activity is being recorded for review.',
      title: 'Attention Required',
    },
    HIGH: {
      bg: 'bg-rose-500/20 border-rose-500/40 text-rose-200',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />,
      defaultMsg: 'High-risk integrity activity detected. Your attempt has been flagged for administrator review.',
      title: 'High Risk Alert',
    },
  };

  const current = configs[riskLevel] || configs.LOW;

  return (
    <div
      className={`flex items-center justify-between p-3.5 mb-4 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-fade-in ${current.bg}`}
    >
      <div className="flex items-center gap-3">
        {current.icon}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider">{current.title}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              Score: {riskScore}
            </span>
          </div>
          <p className="text-sm font-medium mt-0.5">{message || current.defaultMsg}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          title="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
