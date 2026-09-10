import React from 'react';
import {
  Activity,
  MessageCircle,
  Users2,
  CalendarDays,
  Phone,
  FolderOpen,
  Hexagon,
  MoreHorizontal,
} from 'lucide-react';

const railItems = [
  { icon: Activity, label: 'Activity' },
  { icon: MessageCircle, label: 'Chat' },
  { icon: Users2, label: 'Teams' },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: Phone, label: 'Calls' },
  { icon: FolderOpen, label: 'Files' },
];

export default function IconRail() {
  return (
    <aside className="flex h-full w-[72px] flex-shrink-0 flex-col items-center justify-between bg-[#241f4b] py-3">
      <div className="flex flex-col items-center gap-1">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 font-bold text-white">
          T
        </div>

        {railItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            className="group relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-violet-200/70 hover:text-white"
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="leading-none">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          title="MyLiva"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-lg ring-2 ring-violet-400"
        >
          <Hexagon size={20} fill="currentColor" />
        </button>
        <button className="text-violet-200/60 hover:text-white">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </aside>
  );
}
