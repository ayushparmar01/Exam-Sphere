import React from 'react';
import { Check, CloudOff, Loader2, RefreshCw } from 'lucide-react';

export const AutoSaveIndicator = ({ status = 'saved' }) => {
  // status: 'saving' | 'saved' | 'offline' | 'synced'
  switch (status) {
    case 'saving':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
          <span>Saving...</span>
        </div>
      );
    case 'offline':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <CloudOff className="w-3 h-3 text-rose-600" />
          <span>Offline — retrying...</span>
        </div>
      );
    case 'synced':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <RefreshCw className="w-3 h-3 text-emerald-600" />
          <span>Synced ✓</span>
        </div>
      );
    case 'saved':
    default:
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Saved ✓</span>
        </div>
      );
  }
};
