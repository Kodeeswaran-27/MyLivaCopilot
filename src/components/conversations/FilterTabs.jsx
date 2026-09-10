import React, { useState } from 'react';

export default function FilterTabs({ tabs = [], onChange }) {
  const [active, setActive] = useState(tabs[0] || 'All');

  return (
    <div className="thin-scroll flex gap-2 overflow-x-auto px-4 pb-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => { setActive(tab); onChange?.(tab); }}
          className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            active === tab
              ? 'bg-violet-100 text-violet-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
