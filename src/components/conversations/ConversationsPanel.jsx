import React, { useMemo, useState } from 'react';
import { AlertTriangle, Archive, ChevronDown, MessageCircle, Pin, Plus, Search, SlidersHorizontal, Trash2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationsPanel({ filters = [], conversations = [], selectedId, onSelectConversation, onNew, onArchive, onDelete, onRename }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('chats');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const counts = { chats: conversations.filter((item) => !item.archived).length, pinned: conversations.filter((item) => item.pinned && !item.archived).length, archived: conversations.filter((item) => item.archived).length };
  const filtered = useMemo(() => conversations.filter((conversation) => {
    const text = `${conversation.title} ${conversation.preview || ''}`.toLowerCase().includes(query.toLowerCase());
    const agent = category === 'All' || conversation.category === category;
    const section = view === 'archived' ? conversation.archived : view === 'pinned' ? conversation.pinned && !conversation.archived : !conversation.archived;
    return text && agent && section;
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt)), [conversations, query, category, view]);
  const confirmDelete = async () => { if (!deleteTarget) return; await onDelete?.(deleteTarget); setDeleteTarget(null); };

  if (collapsed) {
    return (
      <section className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-3 border-r border-slate-200 bg-white py-5">
        <button onClick={() => setCollapsed(false)} title="Expand conversations" className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100">
          <PanelLeftOpen size={18} />
        </button>
        <button onClick={() => onNew?.()} title="New chat" className="rounded-xl bg-violet-600 p-2.5 text-white shadow-sm transition hover:bg-violet-700">
          <Plus size={18} />
        </button>
      </section>
    );
  }

  return <section className="flex h-full w-[340px] flex-shrink-0 flex-col border-r border-slate-200 bg-white">
    <div className="border-b border-slate-100 px-4 pb-4 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Conversations</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">{counts.chats} active sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setQuery(''); setView('chats'); onNew?.(); }} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-violet-700">
            <Plus size={16} />New chat
          </button>
          <button onClick={() => setCollapsed(true)} title="Collapse panel" className="flex-shrink-0 rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>
      <div className="relative mt-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${view}...`} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100" /></div>
      {/* <div className="mt-3 flex items-center gap-2"><span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><SlidersHorizontal size={13} />Agent</span><div className="relative flex-1"><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-600 outline-none"><option value="All">All agents</option>{filters.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></div></div> */}
    </div>

    <div className="thin-scroll flex-1 space-y-1 overflow-y-auto px-2 py-3">{filtered.map((conversation) => <ConversationItem key={conversation.id} conversation={{ ...conversation, active: conversation.id === selectedId, time: new Date(conversation.updatedAt).toLocaleDateString() }} onSelect={onSelectConversation} onArchive={onArchive} onDelete={setDeleteTarget} onRename={onRename} />)}{filtered.length === 0 && <div className="px-5 py-16 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{view === 'pinned' ? <Pin size={18} /> : view === 'archived' ? <Archive size={18} /> : <MessageCircle size={18} />}</div><p className="mt-3 text-sm font-semibold text-slate-600">No {view} found</p></div>}</div>

    <div className="grid grid-cols-3 gap-1 border-t border-slate-200 bg-slate-50 p-2">{[['chats', 'Chats', MessageCircle], ['archived', 'Archived', Archive]].map(([key, label, Icon]) => <button key={key} onClick={() => setView(key)} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${view === key ? 'bg-white text-violet-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70'}`}><span className="relative"><Icon size={16} fill={key === 'pinned' && view === key ? 'currentColor' : 'none'} />{counts[key] > 0 && <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-100 px-1 text-[9px] text-violet-700">{counts[key]}</span>}</span>{label}</button>)}</div>

    {deleteTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}><div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600"><AlertTriangle size={20} /></span><button onClick={() => setDeleteTarget(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button></div><h3 className="mt-4 text-lg font-bold text-slate-900">Delete conversation?</h3><p className="mt-2 text-sm leading-5 text-slate-500">"{deleteTarget.title}" and all of its messages will be permanently removed. This action cannot be undone.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button onClick={confirmDelete} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"><Trash2 size={15} />Delete</button></div></div></div>}
  </section>;
}