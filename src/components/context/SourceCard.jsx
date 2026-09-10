import React from 'react';
import { FileText, File, ExternalLink } from 'lucide-react';

export default function SourceCard({ doc, onOpen }) {
  const isPdf = doc.type === 'pdf';
  return (
    <button onClick={() => { if (doc.url) window.open(doc.url, '_blank', 'noopener,noreferrer'); onOpen?.(); }} disabled={!doc.url} className="flex w-full items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition hover:border-violet-100 hover:bg-violet-50/40 disabled:cursor-default disabled:opacity-70">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
          isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
        }`}
      >
        {isPdf ? <FileText size={16} /> : <File size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-gray-800">{doc.name}</p>
        <p className="text-[12px] text-gray-400">{doc.meta}</p>
      </div>
      {doc.url && <ExternalLink size={13} className="mt-1 flex-shrink-0 text-gray-300" />}
    </button>
  );
}
