import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items to display in this view.',
  actionText = null,
  actionLink = null,
  onAction = null,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6">{description}</p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
};
