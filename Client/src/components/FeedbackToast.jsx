import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FeedbackToast = ({ toast, onClose }) => {
  const { title, message, type = 'info' } = toast;

  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-gradient-to-br from-primary-600 to-secondary-600';

  return (
    <div className={`max-w-sm w-full ${bg} text-white rounded-xl shadow-xl p-4 mb-3 ring-1 ring-white/20`}>
      <div className="flex items-start">
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {message && <div className="text-sm opacity-90">{message}</div>}
        </div>
        <button onClick={onClose} className="ml-3 p-1 rounded-full bg-white/10 hover:bg-white/20">
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackToast;
