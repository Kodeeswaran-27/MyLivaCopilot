import React from 'react';
import { ClipboardList, UserCog, ShieldPlus, GraduationCap } from 'lucide-react';

const icons = [ClipboardList, UserCog, ShieldPlus, GraduationCap];

export default function SuggestedPrompts({ prompts = [], onPick }) {
  if (!prompts.length) return null;

  return (
    <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {prompts.map((prompt, i) => {
        const Icon = icons[i % icons.length];
        return (
          <button
            key={prompt}
            onClick={() => onPick?.(prompt)}
            className="flex items-center gap-3.5 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left text-[15px] font-medium text-gray-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-violet-300 hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-transform duration-200 group-hover:scale-110">
              <Icon size={18} />
            </span>
            {prompt}
          </button>
        );
      })}
    </div>
  );
}