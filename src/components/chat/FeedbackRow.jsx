import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Share2,
  Search,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export default function FeedbackRow({ message, meta, time, onAction }) {
  const [rating, setRating] = useState('');
  const copy = async () => { await navigator.clipboard.writeText(message?.greeting || ''); onAction?.('Response copied'); };
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setRating('up'); onAction?.('Thanks for your feedback'); }} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-medium ${rating === 'up' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          <ThumbsUp size={12.5} />
          Helpful
        </button>
        <button onClick={() => { setRating('down'); onAction?.('Feedback noted'); }} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-medium ${rating === 'down' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          <ThumbsDown size={12.5} />
          Not helpful
        </button>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-50">
          <Copy size={12.5} />
          Copy
        </button>
        <button onClick={() => onAction?.('A fresh response was generated')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-50">
          <RotateCcw size={12.5} />
          Regenerate
        </button>
        <button onClick={async () => { await navigator.clipboard.writeText(message?.greeting || ''); onAction?.('Shareable response copied'); }} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[12px] font-medium text-gray-500 hover:bg-gray-50">
          <Share2 size={12.5} />
          Share
        </button>
      </div>
      <span className="text-[11px] text-gray-400">{time}</span>

      {meta && (
        <div className="mt-1 flex w-full flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
            <Search size={12} />
            Retrieved from {meta.retrieved}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-700">
            <Zap size={12} />
            Response time: {meta.responseTime}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11.5px] font-medium text-blue-700">
            <ShieldCheck size={12} />
            {meta.confidence} confidence
          </span>
        </div>
      )}
    </div>
  );
}
