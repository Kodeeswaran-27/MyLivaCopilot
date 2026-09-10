import React from 'react';
import {
  BarChart2,
  MessageCircle,
  Sparkles,
  Users,
  Calendar,
  Phone,
  FileText,
  Wrench,
  Bell,
  MessageSquare,
  Settings,
  HelpCircle,
  Info,
  Grid3x3,
  Hexagon,
} from 'lucide-react';

const iconMap = {
  'bar-chart-2': BarChart2,
  'message-circle': MessageCircle,
  sparkles: Sparkles,
  users: Users,
  calendar: Calendar,
  phone: Phone,
  'file-text': FileText,
  wrench: Wrench,
  bell: Bell,
  'message-square': MessageSquare,
  settings: Settings,
};

export default function SecondaryNav({ items = [], activeKey = 'conversations', onAction, onNavigate }) {
  return (
    <nav className="flex h-full w-[220px] flex-shrink-0 flex-col justify-between border-r border-gray-200 bg-white">
      <div className="thin-scroll overflow-y-auto px-3 py-4">
        <div className="mb-5 flex items-center gap-2 px-1">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-violet-600 text-white">
            <Hexagon size={16} fill="currentColor" />
            <img src="/images/branding/enterprise-logo.png" onError={(event) => { event.currentTarget.style.display = 'none'; }} alt="" className="absolute h-8 w-8 rounded-lg object-cover" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">MyLiva</span>
        </div>

        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? MessageCircle;
            const isActive = item.key === activeKey;
            return (
              <li key={item.key}>
                <button
                  onClick={() => { onNavigate?.(item.key); onAction?.(`${item.label} opened`); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} strokeWidth={1.9} />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-0.5 border-t border-gray-100 px-3 py-3">
        <button onClick={() => onAction?.('Help center opened')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50">
          <HelpCircle size={17} strokeWidth={1.9} />
          Help
        </button>
        <button onClick={() => onAction?.('MyLiva version 1.0')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50">
          <Info size={17} strokeWidth={1.9} />
          About
        </button>
        <button onClick={() => onAction?.('Apps menu opened')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50">
          <Grid3x3 size={17} strokeWidth={1.9} />
          Apps
        </button>
      </div>
    </nav>
  );
}
