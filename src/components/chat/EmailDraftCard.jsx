import React from 'react';
import { Mail, Pencil, Send, Save } from 'lucide-react';

export default function EmailDraftCard({ email, time, onAction }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[13px]">
        <Mail size={14} className="text-gray-400" />
        <span className="text-gray-500">To:</span>
        <span className="font-medium text-gray-800">{email.to}</span>
        <span className="mx-1 text-gray-300">·</span>
        <span className="text-gray-500">Subject:</span>
        <span className="font-medium text-gray-800">{email.subject}</span>
      </div>

      <div className="whitespace-pre-line px-4 py-3 text-[13.5px] leading-relaxed text-gray-700">
        {email.body}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button onClick={() => onAction?.('Email editor opened')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] font-medium text-gray-600 hover:bg-gray-50">
            <Pencil size={13} />
            Edit
          </button>
          <button onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`; }} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] font-medium text-gray-600 hover:bg-gray-50">
            <Send size={13} />
            Send via Outlook
          </button>
          <button onClick={() => { localStorage.setItem('hr-email-draft', JSON.stringify(email)); onAction?.('Draft saved locally'); }} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] font-medium text-gray-600 hover:bg-gray-50">
            <Save size={13} />
            Save draft
          </button>
        </div>
        <span className="text-[11px] text-gray-400">{time}</span>
      </div>
    </div>
  );
}
