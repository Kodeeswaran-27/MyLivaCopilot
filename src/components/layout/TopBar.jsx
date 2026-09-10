import React, { useEffect, useRef, useState } from 'react';
import { Bell, Bot, ChevronDown, Loader2, LogOut, MessageCircle, Search, Settings, User, Users, X, Hexagon } from 'lucide-react';
import { sessionsApi } from '../../data/sessionsApi';

export default function TopBar({ currentUser = {}, onResult, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({ conversations: [], agents: [], users: [] });
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault(); searchRef.current?.querySelector('input')?.focus(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults({ conversations: [], agents: [], users: [] }); setSearching(false); return; }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try { setResults(await sessionsApi.search(query.trim())); }
      catch (error) { onAction?.(error.message); }
      finally { setSearching(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const choose = (result) => { onResult?.(result); setQuery(''); setSearchOpen(false); };
  const total = results.conversations.length + results.agents.length + results.users.length;
  const groups = [
    ['Conversations', results.conversations, MessageCircle, (item) => item.preview || item.category],
    ['Agents', results.agents, Bot, (item) => item.category],
    ['Users', results.users, Users, (item) => `${item.department} · ${item.email}`],
  ];
  const signOut = () => { localStorage.removeItem('enterprise-gpt-user'); setMenuOpen(false); onAction?.('Signed out successfully'); };

  return <header className="relative z-40 flex h-16 flex-shrink-0 items-center border-b border-slate-200 bg-white px-6 shadow-sm">
    <div className="flex flex-1 items-center gap-6">
      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-violet-600 text-white">
          <Hexagon size={16} fill="currentColor" />
          <img src="/images/branding/enterprise-logo.png" onError={(event) => { event.currentTarget.style.display = 'none'; }} alt="" className="absolute h-8 w-8 rounded-lg object-cover" />
        </div>
        <span className="text-[15px] font-bold text-gray-900">MyLiva</span>
      </div>

      <div ref={searchRef} className="relative w-full max-w-2xl">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') { setQuery(''); setSearchOpen(false); } if (event.key === 'Enter' && total === 1) choose([...results.conversations, ...results.agents, ...results.users][0]); }} placeholder="Search conversations, messages, agents and users" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-20 text-sm text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"/>
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">{searching && <Loader2 size={15} className="animate-spin text-violet-500"/>}{query && <button title="Clear search" onClick={() => setQuery('')} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={15}/></button>}{!query && <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl E</kbd>}</div>
        {searchOpen && query.trim().length >= 2 && <div className="absolute left-0 right-0 top-13 mt-2 max-h-[480px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><div className="flex items-center justify-between px-3 py-2"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Search results</span><span className="text-[11px] text-slate-400">{total} found</span></div>{!searching && total === 0 && <div className="px-4 py-10 text-center"><Search className="mx-auto text-slate-300" size={26}/><p className="mt-2 text-sm font-semibold text-slate-600">No matching results</p><p className="mt-1 text-xs text-slate-400">Try a conversation title, message, person or agent.</p></div>}{groups.map(([label, items, Icon, subtitle]) => items.length > 0 && <div key={label} className="mb-2"><p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>{items.map((item) => <button key={`${item.type}-${item.id}`} onClick={() => choose(item)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-violet-50"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Icon size={17}/></span><span className="min-w-0"><strong className="block truncate text-sm text-slate-800">{item.title || item.name}</strong><small className="block truncate text-xs text-slate-400">{subtitle(item)}</small></span></button>)}</div>)}</div>}
      </div>
    </div>

    <div className="ml-6 flex flex-shrink-0 items-center gap-2">
      <button onClick={() => onAction?.('Settings opened')} aria-label="Settings" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
        <Settings size={18}/></button>
      <button onClick={() => onAction?.('You have 3 notifications')} aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
        <Bell size={18}/><span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">3</span></button>
      <div ref={menuRef} className="relative ml-1">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 hover:border-slate-200 hover:bg-slate-50">
          {/* <img src={currentUser.avatar} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = currentUser.fallbackAvatar; }} alt={currentUser.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-400"/> */}
          <span className="hidden text-left lg:block">
            <strong className="block text-xs text-slate-800">{currentUser.name}</strong>
          <small className="text-[10px] text-slate-400">Online</small></span>
          <ChevronDown size={14} className={`text-slate-400 transition ${menuOpen ? 'rotate-180' : ''}`}/></button>
        {menuOpen && <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 p-4"><p className="font-bold text-slate-900">{currentUser.name}</p><p className="text-xs text-slate-500">{currentUser.email}</p></div><div className="p-2"><button onClick={() => onAction?.('Profile opened')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"><User size={16}/>My profile</button><button onClick={() => onAction?.('Account settings opened')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"><Settings size={16}/>Account settings</button><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut size={16}/>Sign out</button></div></div>}
      </div>
    </div>
  </header>;
}
