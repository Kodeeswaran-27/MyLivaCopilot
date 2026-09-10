import React, { useRef, useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import SuggestedPrompts from './SuggestedPrompts';
import ChatInput from './ChatInput';
import { sessionsApi } from '../../data/sessionsApi';

const displayTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatPanel({ session, suggestedPrompts = [], currentUser, onSessionChange, onChatActivity, onAction, onOpenContext }) {
  const [messages, setMessages] = useState((session?.messages || []).map((message) => ({ ...message, greeting: message.role === 'assistant' ? message.text : undefined, time: displayTime(message.createdAt) })));
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const handleSend = async (text, value = null) => {
    if (sending) return;
    onChatActivity?.();
    const optimistic = { id: `pending-${Date.now()}`, role: 'user', text, time: displayTime() };
    setMessages((previous) => [...previous, optimistic]); setDraft(''); setSending(true);
    try {
      const result = await sessionsApi.respond(session?.id, text, value);
      if (result.session && result.session.messages) {
        const formatted = result.session.messages.map((m) => ({
          ...m,
          greeting: m.role === 'assistant' ? m.text : undefined,
          time: displayTime(m.createdAt)
        }));
        setMessages(formatted);
        onSessionChange?.({ ...result.session, messages: formatted });
      } else {
        const savedUser = { ...result.userMessage, time: displayTime() };
        const assistant = { ...result.assistantMessage, greeting: result.assistantMessage.text, time: displayTime() };
        setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), savedUser, assistant]);
      }
    } catch (error) { setMessages(messages); onAction?.(error.message); }
    finally { setSending(false); }
  };

  useEffect(() => {
    window.sendChatMessage = handleSend;
    return () => {
      window.sendChatMessage = null;
    };
  }, [handleSend]);

  // Poll session messages every 3 seconds to sync any delayed background bot actions
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(async () => {
      try {
        const updated = await sessionsApi.get(session.id);
        if (updated && updated.messages) {
          const currentLength = messages.length;
          const updatedLength = updated.messages.length;

          if (updatedLength > currentLength) {
            const formatted = updated.messages.map((message) => ({
              ...message,
              greeting: message.role === 'assistant' ? message.text : undefined,
              time: displayTime(message.createdAt)
            }));
            setMessages(formatted);
            onSessionChange?.(updated);
          }
        }
      } catch (e) {
        console.error("Failed to sync session:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session?.id, messages.length, onSessionChange]);

  const handlePin = session?.id ? async () => {
    try {
      const updated = await sessionsApi.update(session.id, { pinned: !session.pinned });
      onSessionChange?.(updated);
      onAction?.(updated.pinned ? 'Conversation pinned' : 'Conversation unpinned');
    } catch (error) { onAction?.(error.message); }
  } : undefined;

  const isNewChat = messages.length === 0;

  return <section className="flex h-full min-w-0 flex-1 flex-col bg-[#fafafa]">
    <ChatHeader title={session?.title} pinned={session?.pinned} messages={messages} onPin={handlePin} onAction={onAction} onOpenContext={onOpenContext} currentUser={currentUser}/>

    {isNewChat ? (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-violet-100 text-3xl text-violet-700">
            {logoError ? '✦' : (
              <img
                src="/images/branding/LevisLogo.png"
                alt="MyLiva"
                onError={() => setLogoError(true)}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <h1 className="mt-6 text-4xl font-bold text-slate-900">
            {currentUser?.name ? `Hi ${currentUser.name.split(' ')[0]}, how can I help you today?` : 'How can I help you today?'}
          </h1>
          <p className="mt-3 text-base text-slate-500">Ask a question, or pick a suggestion below to get started.</p>
          <div className="mt-8">
            <ChatInput value={draft} onChange={setDraft} onSend={handleSend} onAction={onAction}/>
          </div>
          <SuggestedPrompts prompts={suggestedPrompts} onPick={handleSend} />
        </div>
      </div>
    ) : (
      <>
        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {messages.map((message) => message.role === 'user' ? <UserMessage key={message.id} message={message} currentUser={currentUser}/> : <AssistantMessage key={message.id} message={message} onAction={onAction}/>)}
          {sending && <div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-500"/>Waiting for assistant API…</div>}
          <div ref={bottomRef}/>
        </div>
        <ChatInput value={draft} onChange={setDraft} onSend={handleSend} onAction={onAction}/>
      </>
    )}
  </section>;
}