import React, { useState } from 'react';
import { Archive, ArchiveRestore, BookOpen, Briefcase, DollarSign, MessageCircle, Monitor, Pencil, Pin, Trash2, UserPlus, Users } from 'lucide-react';

const iconMap = { users: Users, monitor: Monitor, 'dollar-sign': DollarSign, briefcase: Briefcase, 'user-plus': UserPlus, 'book-open': BookOpen, 'message-circle': MessageCircle };

export default function ConversationItem({ conversation, onSelect, onArchive, onDelete, onRename }) {
  const Icon = iconMap[conversation.icon] ?? MessageCircle;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const startRename = (event) => {
    event.stopPropagation();
    setEditValue(conversation.title);
    setIsEditing(true);
  };

  const saveRename = () => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== conversation.title) {
      onRename?.(conversation, trimmed);
    }
  };

  const cancelRename = () => {
    setEditValue(conversation.title);
    setIsEditing(false);
  };

  return <div onClick={() => !isEditing && onSelect?.(conversation)} onKeyDown={(event) => event.key === 'Enter' && !isEditing && onSelect?.(conversation)} role="button" tabIndex={0} className={`group relative flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-violet-300 ${conversation.active ? 'bg-violet-50 ring-1 ring-inset ring-violet-200' : conversation.pinned ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-100 hover:bg-amber-50' : 'hover:bg-slate-50'}`}>
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${conversation.iconBg}`}><Icon size={16}/></div>
    <div className="min-w-0 flex-1 pr-1">
      <div className="flex items-center gap-1.5">
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={saveRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); saveRename(); }
              else if (event.key === 'Escape') { event.preventDefault(); cancelRename(); }
            }}
            className="min-w-0 flex-1 rounded-md border border-violet-300 bg-white px-1.5 py-0.5 text-[13.5px] font-semibold text-slate-900 outline-none ring-2 ring-violet-100"
          />
        ) : (
          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-900">{conversation.title}</p>
        )}
        {conversation.pinned && <Pin size={11} fill="currentColor" className="flex-shrink-0 text-amber-500"/>}
        <span className="flex-shrink-0 text-[10px] text-slate-400 group-hover:hidden">{conversation.time}</span>
      </div>
      <p className="mt-0.5 truncate pr-1 text-[12px] text-slate-500">{conversation.preview}</p>
    </div>
    <div className="absolute right-2 top-2 hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
      <button title="Rename conversation" onClick={startRename} className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-700"><Pencil size={14}/></button>
      <button title={conversation.archived ? 'Restore conversation' : 'Archive conversation'} onClick={(event) => { event.stopPropagation(); onArchive?.(conversation, !conversation.archived); }} className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-700">{conversation.archived ? <ArchiveRestore size={14}/> : <Archive size={14}/>}</button>
      <button title="Delete conversation" onClick={(event) => { event.stopPropagation(); onDelete?.(conversation); }} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14}/></button>
    </div>
  </div>;
}