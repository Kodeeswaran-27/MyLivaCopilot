import React from 'react';
import { Check } from 'lucide-react';

export default function UserMessage({ message, currentUser = {} }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[65%]">
        <div className="rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
          {message.text}
        </div>
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-400">
          {message.time}
          <Check size={13} className="text-violet-500" />
        </div>
      </div>
     <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white"
        title={currentUser.name}
      >
        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
      </div>
    </div>
  );
}
