import React, { useState } from 'react';
import { Plus, Mic, Send } from 'lucide-react';

export default function ChatInput({ value, onChange, onSend, onAction }) {
  const [internalValue, setInternalValue] = useState('');
  const text = value ?? internalValue;
  const setText = onChange ?? setInternalValue;

  const handleSend = () => {
    if (!text.trim()) return;
    onSend?.(text);
    if (!onChange) setInternalValue('');
  };

  return (
    <div className="border-t border-gray-100 px-6 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
        <button onClick={() => onAction?.('Attachment picker opened')} aria-label="Attach file" className="flex-shrink-0 text-gray-400 hover:text-gray-600">
          <Plus size={19} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          type="text"
          placeholder="Type your query here..."
          className="flex-1 bg-transparent text-[13.5px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <button onClick={() => onAction?.('Voice input is ready')} aria-label="Voice input" className="flex-shrink-0 text-gray-400 hover:text-gray-600">
          <Mic size={18} />
        </button>
        <button
          onClick={handleSend}
          className="flex flex-shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700"
        >
          <Send size={15} />
        </button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
        MyLiva may produce inaccurate info. Verify important details.
        <span className="mx-1 text-gray-300">·</span>
        Grounded on internal knowledge base
      </p>
    </div>
  );
}
