import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Pin, Share2, Download, PanelRightOpen, Bell, Settings, User, LogOut, ChevronDown } from 'lucide-react';

export default function ChatHeader({ title, pinned = false, messages = [], onPin, onAction, onOpenContext, currentUser = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const signOut = () => { localStorage.removeItem('enterprise-gpt-user'); setMenuOpen(false); onAction?.('Signed out successfully'); };

  const transcript = messages.map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.text || m.greeting || ''}`).join('\n\n');
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: title || 'MyLiva conversation', text: transcript });
      else { await navigator.clipboard.writeText(transcript); onAction?.('Shareable transcript copied'); }
    } catch (error) { if (error.name !== 'AbortError') onAction?.('Unable to share this conversation'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `${(title || 'conversation').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt` });
    link.click(); URL.revokeObjectURL(url); onAction?.('Transcript downloaded');
  };

  return <header className="flex h-[69px] items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-sm">
        {logoError ? (
          <Sparkles size={18} />
        ) : (
          <img
            src="/images/branding/LevisLogo.png"
            alt="MyLiva"
            onError={() => setLogoError(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <h1 className="text-[16px] font-bold tracking-tight text-slate-900">MyLiva</h1>
        <span className="h-2 w-2 rounded-full bg-emerald-500"/>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-slate-500">
        <button title={pinned ? 'Unpin conversation' : 'Pin conversation'} disabled={!onPin} onClick={onPin} className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${pinned ? 'bg-white text-violet-700 shadow-sm' : 'hover:bg-white hover:text-slate-800'}`}><Pin size={16} fill={pinned ? 'currentColor' : 'none'}/></button>
        <button title="Share conversation" onClick={share} className="rounded-lg p-2 transition hover:bg-white hover:text-slate-800"><Share2 size={16}/></button>
        <button title="Download transcript" onClick={download} className="rounded-lg p-2 transition hover:bg-white hover:text-slate-800"><Download size={16}/></button>
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-500">
          <button onClick={() => onAction?.('Settings opened')} aria-label="Settings" className="rounded-lg p-2 hover:bg-slate-100">
            <Settings size={17}/>
          </button>
          <button onClick={() => onAction?.('You have 3 notifications')} aria-label="Notifications" className="relative rounded-lg p-2 hover:bg-slate-100">
            <Bell size={17}/>
          </button>
        </div>

        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 bg-slate-50 hover:bg-slate-100">
            <span className="text-left block">
              <strong className="block text-xs text-slate-800">{currentUser?.name}</strong>
              <small className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
                Online
              </small>
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
    </div>
  </header>;
}