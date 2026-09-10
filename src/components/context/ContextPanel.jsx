import React, { useState, useEffect, useRef } from 'react';
import { Archive, ChevronDown, ChevronUp, Download, FileStack, Trash2, X, Bell, Settings, User, LogOut } from 'lucide-react';
import SourceCard from './SourceCard';
import SessionInsights from './SessionInsights';

export default function ContextPanel({ currentUser = {}, documents = [], session, isExpanded = true, onToggleExpand, onAction, onArchive, onClear }) {
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const visibleDocuments = showAllSources ? documents : documents.slice(0, 3);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const exportTranscript = () => {
    const transcript = (session?.messages || []).map((message) => `${message.role}: ${message.text || message.greeting || ''}`).join('\n\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: `${session?.title || 'conversation'}.txt` });
    link.click(); URL.revokeObjectURL(url); onAction?.('Transcript exported');
  };

  const signOut = () => { localStorage.removeItem('enterprise-gpt-user'); setMenuOpen(false); onAction?.('Signed out successfully'); };

  return <aside className="thin-scroll flex h-full w-[320px] flex-shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-[#fbfcfe] shadow-[-8px_0_24px_rgba(15,23,42,0.04)]">
    {/* Profile Header */}
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      {/* Left side: Settings & Notifications */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => onAction?.('Settings opened')} aria-label="Settings" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Settings size={17}/>
        </button>
        <button onClick={() => onAction?.('You have 3 notifications')} aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={17}/>
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">3</span>
        </button>
      </div>

      {/* Right side (last): Profile */}
      <div ref={menuRef} className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 bg-slate-50 hover:bg-slate-100">
          <span className="text-left block">
            <strong className="block text-xs text-slate-800">{currentUser?.name}</strong>
            <small className="text-[10px] text-slate-400">Online</small>
          </span>
          <ChevronDown size={14} className={`text-slate-400 transition ${menuOpen ? 'rotate-180' : ''}`}/>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-30">
            <div className="border-b border-slate-100 p-4">
              <p className="font-bold text-slate-900 text-sm">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
            </div>
            <div className="p-2">
              <button onClick={() => onAction?.('Profile opened')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs hover:bg-slate-50">
                <User size={14}/>My profile
              </button>
              <button onClick={() => onAction?.('Account settings opened')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs hover:bg-slate-50">
                <Settings size={14}/>Account settings
              </button>
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50">
                <LogOut size={14}/>Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Commented out Context & Sources and Collapsible Content */}
    {/* 
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">Context &amp; Sources</h2>
        <p className="mt-0.5 text-[11px] text-slate-400">Session resources and details</p>
      </div>
      <button title={isExpanded ? "Collapse section" : "Expand section"} onClick={onToggleExpand} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>
    </div>

    {isExpanded && (
      <>
        <section className="border-b border-slate-200 bg-white px-4 py-4">
          <button onClick={() => setSourcesCollapsed(!sourcesCollapsed)} className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"><span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.08em] text-slate-400"><FileStack size={14} className="text-violet-500"/>Referenced documents <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-600">{documents.length}</span></span>{sourcesCollapsed ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronUp size={16} className="text-slate-400"/>}</button>
          {!sourcesCollapsed && <div className="mt-3"><div className="space-y-2">{visibleDocuments.map((document) => <SourceCard key={document.id} doc={document} onOpen={() => onAction?.(`${document.name} opened`)}/>)}</div>{documents.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"><p className="text-xs font-semibold text-slate-600">No references for this response</p><p className="mt-1 text-[11px] leading-4 text-slate-400">The assistant API did not return a source document or reference link.</p></div>}{documents.length > 3 && <button onClick={() => setShowAllSources(!showAllSources)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100">{showAllSources ? 'Show fewer sources' : `View all sources (${documents.length})`}{showAllSources ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>}</div>}
        </section>

        <section className="border-b border-slate-200 px-4 py-5"><h3 className="mb-3 text-[11px] font-bold uppercase tracking-[.08em] text-slate-400">Session insights</h3><SessionInsights session={session}/></section>

        <section className="px-4 py-5"><h3 className="mb-3 text-[11px] font-bold uppercase tracking-[.08em] text-slate-400">Quick actions</h3><div className="space-y-2"><button onClick={exportTranscript} disabled={!session?.messages?.length} className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Download size={14}/>Export transcript</button><button onClick={onArchive} disabled={!session?.id} className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"><Archive size={14}/>Archive conversation</button><button onClick={() => { onClear?.(); onAction?.('Conversation cleared'); }} className="flex w-full items-center gap-2.5 rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-[13px] font-medium text-rose-600 shadow-sm hover:bg-rose-50"><Trash2 size={14}/>Clear conversation</button></div></section>
      </>
    )}
    */}
  </aside>;
}
