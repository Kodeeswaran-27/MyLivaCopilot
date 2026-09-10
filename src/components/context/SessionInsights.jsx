import React from 'react';

export default function SessionInsights({ session }) {
  const messages = session?.messages || [];
  const rows = [
    { label: 'Messages', value: messages.length },
    { label: 'Created', value: session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Not saved' },
    { label: 'Category', value: session?.category || 'General', positive: true },
    { label: 'Words', value: messages.reduce((total, message) => total + String(message.text || '').split(/\s+/).filter(Boolean).length, 0) },
  ];
  return <div className="space-y-2.5 rounded-xl border border-gray-100 px-3 py-3">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 text-[13px]"><span className="text-gray-500">{row.label}</span><span className={`truncate font-semibold ${row.positive ? 'text-emerald-600' : 'text-gray-800'}`}>{row.value}</span></div>)}</div>;
}
