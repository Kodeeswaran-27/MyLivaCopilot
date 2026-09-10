import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

export default function RelatedAgentCard({ agent, onOpen }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50">
      <div className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${agent.color}`}>
        <Shield size={15} />
        {agent.online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-gray-800">{agent.name}</p>
        <p className="truncate text-[12px] text-gray-400">{agent.desc}</p>
      </div>
      <ChevronRight size={14} className="flex-shrink-0 text-gray-300" />
    </button>
  );
}
