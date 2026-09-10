import { Sparkles, FileText } from 'lucide-react';
import React, { useState } from 'react';
import EmailDraftCard from './EmailDraftCard';
import FeedbackRow from './FeedbackRow';

function parseInlineMarkdown(text, message, onAction, imageState) {
  if (!text) return '';
  const parts = [];
  let index = 0;

  // Match bold (**), italics (*), inline code (`), images (![alt](url)), and links ([text](url))
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5|!\[(.*?)\]\((.*?)\)|\[(.*?)\]\((.*?)\)/g;
  let match;

  const titleOf = (a) => (typeof a === 'object' && a !== null ? String(a.title) : String(a)).toLowerCase();

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > index) {
      parts.push(text.slice(index, matchIndex));
    }

    if (match[1]) {
      parts.push(<strong key={matchIndex} className="font-semibold text-slate-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={matchIndex} className="italic text-slate-800">{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<code key={matchIndex} className="px-1.5 py-0.5 rounded bg-slate-50 text-[11.5px] font-mono text-pink-600 border border-slate-100">{match[6]}</code>);
    } else if (match[7] !== undefined) {
      const src = match[8];

      // 1) Emoji/rating-image keyword matching (unchanged behavior for rating cards)
      let emojiLabel = null;
      if (src.includes('veryhappy')) emojiLabel = 'Excellent';
      else if (src.includes('happy') && !src.includes('very')) emojiLabel = 'Good';
      else if (src.includes('neutral')) emojiLabel = 'Neutral';
      else if (src.includes('sad') && !src.includes('very')) emojiLabel = 'Poor';
      else if (src.includes('verysad')) emojiLabel = 'Very Poor';

      let resolvedAction = emojiLabel;

      if (emojiLabel && message && message.quickActions) {
        let matchTerm = '';
        if (src.includes('veryhappy')) matchTerm = 'very';
        else if (src.includes('happy')) matchTerm = 'happy';
        else if (src.includes('neutral')) matchTerm = 'neutral';
        else if (src.includes('verysad')) matchTerm = 'very';
        else if (src.includes('sad')) matchTerm = 'sad';

        let directMatch = null;
        if (src.includes('veryhappy')) {
          directMatch = message.quickActions.find(a => titleOf(a).includes('very') && titleOf(a).includes('happy'))
            || message.quickActions.find(a => titleOf(a).includes('happy'));
        } else if (src.includes('verysad')) {
          directMatch = message.quickActions.find(a => titleOf(a).includes('very') && titleOf(a).includes('sad'))
            || message.quickActions.find(a => titleOf(a).includes('sad'));
        } else {
          directMatch = message.quickActions.find(a => titleOf(a).includes(matchTerm));
        }
        if (directMatch) resolvedAction = directMatch;
      }

      // 2) Generic fallback: for non-emoji images, match to quickActions positionally,
      //    in the order each image appears in the message (covers card tiles like
      //    "System Notification" / "Communication" images).
      if (!emojiLabel && imageState && message && message.quickActions) {
        const fallback = message.quickActions[imageState.index];
        if (fallback !== undefined) resolvedAction = fallback;
      }

      // Track which quickAction (by index) got consumed by an image, so the
      // bottom "Quick actions" row doesn't render a duplicate button for it.
      let consumedIndex = null;
      if (resolvedAction && message && message.quickActions) {
        const idx = message.quickActions.indexOf(resolvedAction);
        if (idx !== -1) consumedIndex = idx;
      }
      if (imageState) {
        if (consumedIndex !== null) imageState.consumed.add(consumedIndex);
        imageState.index += 1;
      }

      if (resolvedAction) {
        const title = typeof resolvedAction === 'object' && resolvedAction !== null ? resolvedAction.title : String(resolvedAction);
        const value = typeof resolvedAction === 'object' && resolvedAction !== null ? resolvedAction.value : null;
        parts.push(
          <img
            key={matchIndex}
            src={src}
            alt={match[7] || 'image'}
            onClick={() => {
              if (window.sendChatMessage) {
                window.sendChatMessage(title, value);
              } else {
                onAction?.(`${title} selected`);
              }
            }}
            className="inline-block h-12 w-12 cursor-pointer transition-transform hover:scale-110 object-contain align-middle mr-2.5 my-1"
            title={`Click: ${title}`}
          />
        );
      } else {
        parts.push(
          <img
            key={matchIndex}
            src={src}
            alt={match[7] || 'image'}
            className="inline-block h-8 w-auto object-contain align-middle mr-1.5 my-0.5"
          />
        );
      }
    } else if (match[9] !== undefined) {
      parts.push(
        <a key={matchIndex} href={match[10]} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-750 underline font-medium">
          {match[9]}
        </a>
      );
    }

    index = regex.lastIndex;
  }

  if (index < text.length) {
    parts.push(text.slice(index));
  }

  return parts.length > 0 ? parts : text;
}

function parseMarkdown(text, message, onAction, imageState) {
  if (!text) return null;

  // Collapse newlines between consecutive inline image markdowns (e.g. rating smileys) into spaces
  const normalizedText = text.replace(/(!\[[^\]]*\]\([^)]+\))\s*\n\s*(?=!\[[^\]]*\]\([^)]+\))/g, '$1 ');
  const lines = normalizedText.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  let tableRows = [];
  let inTable = false;

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 list-disc pl-5 space-y-1.5 text-slate-700">
            {currentList}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 list-decimal pl-5 space-y-1.5 text-slate-700">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const hasAlignRow = tableRows.length > 1 && tableRows[1].every(cell => cell.trim().startsWith('-') || cell.trim() === '');
      const headers = tableRows[0];
      const rows = hasAlignRow ? tableRows.slice(2) : tableRows.slice(1);

      elements.push(
        <div key={`table-${elements.length}`} className="my-3.5 overflow-x-auto rounded-xl border border-slate-150 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-slate-150 text-[12.5px]">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 text-left font-semibold">{parseInlineMarkdown(h, message, onAction, imageState)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3.5 py-2.5">{parseInlineMarkdown(cell, message, onAction, imageState)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="text-base font-extrabold text-slate-900 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1">
          {parseInlineMarkdown(trimmed.slice(2), message, onAction, imageState)}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-sm font-bold text-slate-900 mt-3.5 mb-2 border-b border-slate-50 pb-0.5">
          {parseInlineMarkdown(trimmed.slice(3), message, onAction, imageState)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xs font-semibold text-slate-900 mt-3 mb-1 uppercase tracking-wider">
          {parseInlineMarkdown(trimmed.slice(4), message, onAction, imageState)}
        </h3>
      );
      continue;
    }

    if (trimmed === '---') {
      flushList();
      elements.push(<hr key={i} className="my-3 border-t border-slate-100" />);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      currentList.push(<li key={i}>{parseInlineMarkdown(trimmed.slice(2), message, onAction, imageState)}</li>);
      continue;
    }

    const match = trimmed.match(/^(\d+)\.\s(.*)/);
    if (match) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push(<li key={i}>{parseInlineMarkdown(match[2], message, onAction, imageState)}</li>);
      continue;
    }

    if (trimmed === '') {
      flushList();
      elements.push(<div key={i} className="h-2" />);
    } else {
      flushList();
      elements.push(
        <p key={i} className="text-[13.5px] leading-relaxed text-slate-700 my-1">
          {parseInlineMarkdown(line, message, onAction, imageState)}
        </p>
      );
    }
  }

  flushList();
  flushTable();

  return <div className="space-y-1">{elements}</div>;
}

export default function AssistantMessage({ message, onAction }) {
  const [logoError, setLogoError] = useState(false);
  const content = message.text || message.greeting;
  // Tracks image occurrence order + which quickActions get consumed by an image click,
  // so those don't ALSO show up as separate buttons below.
  const imageState = { index: 0, consumed: new Set() };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-white">
        {logoError ? (
          <Sparkles size={14} />
        ) : (
          <img
            src="/images/branding/LevisLogo.png"
            alt="MyLiva"
            onError={() => setLogoError(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="max-w-[80%] flex-1">
        <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
          {content && (
            <div className="text-[13.5px] text-gray-900 leading-normal">
              {parseMarkdown(content, message, onAction, imageState)}
            </div>
          )}

          {message.bullets && (
            <ul className="mt-2 space-y-1.5">
              {message.bullets.map((b) => (
                <li key={b.label} className="text-[13.5px] text-gray-700">
                  <span className="font-semibold text-gray-900">{b.label}:</span> {b.value}
                </li>
              ))}
            </ul>
          )}

          {message.steps && (
            <ol className="mt-2 space-y-1.5">
              {message.steps.map((step, i) => (
                <li key={step} className="flex gap-2 text-[13.5px] text-gray-700">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}

          {message.source && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-[12.5px] text-gray-500">
              <FileText size={13} className="text-gray-400" />
              <span>
                Source: <span className="font-medium text-gray-700">{message.source.label}</span> ·{' '}
                {message.source.section}
              </span>
              <button onClick={() => onAction?.(`${message.source.label} opened`)} className="ml-auto font-medium text-violet-600 hover:text-violet-700">
                View document
              </button>
            </div>
          )}

          {message.quickActions && message.quickActions.some((_, idx) => !imageState.consumed.has(idx)) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] text-gray-500">Quick actions:</span>
              {message.quickActions.map((action, idx) => {
                if (imageState.consumed.has(idx)) return null;
                const title = typeof action === 'object' && action !== null ? action.title : String(action);
                const value = typeof action === 'object' && action !== null ? action.value : null;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (window.sendChatMessage) {
                        window.sendChatMessage(title, value);
                      } else {
                        onAction?.(`${title} selected`);
                      }
                    }}
                    className="rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          )}

          {message.email && <EmailDraftCard email={message.email} time={message.time} onAction={onAction} />}

          {!message.email}
        </div>
      </div>
    </div>
  );
}