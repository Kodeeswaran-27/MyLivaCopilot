// /**
//  * App.jsx
//  * Replace your existing src/App.jsx with this.
//  *
//  * What changed vs your original:
//  *   1. Added BrowserRouter + Routes
//  *   2. Wrapped everything in AuthProvider
//  *   3. /login  → Login page (public)
//  *   4. /chat   → Your existing CopilotAgentPage (protected, any user)
//  *   5. /admin  → New Admin page (protected, admin role only)
//  *   6. /       → redirects based on auth status
//  *
//  * Your existing components (ChatPanel, TopBar, etc.) are unchanged —
//  * they live inside CopilotAgentPage exactly as before.
//  */
// import React from "react";
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import { AuthProvider, useAuth } from "./components/context/AuthContext";
// import ProtectedRoute             from "./components/layout/ProtectedRoute";

// // Your existing pages
// import CopilotAgentPage from "./components/pages/CopilotAgentPage";

// // New pages
// import Login from "./pages/Login";
// import Admin from "./pages/Admin";

// // ── Root redirect — sends user to the right place based on auth ───────────────
// function RootRedirect() {
//   const { isAuthenticated, isAdmin, loading } = useAuth();

//   if (loading) return null; // ProtectedRoute handles the spinner

//   if (!isAuthenticated) return <Navigate to="/login" replace />;
//   if (isAdmin)          return <Navigate to="/admin" replace />;
//   return                       <Navigate to="/chat"  replace />;
// }

// // ── App ───────────────────────────────────────────────────────────────────────
// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>

//           {/* Public */}
//           <Route path="/login" element={<Login />} />

//           {/* User chat — any authenticated user */}
//           <Route
//             path="/chat"
//             element={
//               <ProtectedRoute>
//                 <CopilotAgentPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Admin console — admin role only */}
//           <Route
//             path="/admin/*"
//             element={
//               <ProtectedRoute requireRole="admin">
//                 <Admin />
//               </ProtectedRoute>
//             }
//           />

//           {/* Root → smart redirect */}
//           <Route path="/" element={<RootRedirect />} />

//           {/* Catch-all */}
//           <Route path="*" element={<Navigate to="/" replace />} />

//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

// import React from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import CopilotAgentPage from "./components/pages/CopilotAgentPage";
// import Admin from "./pages/Admin";
// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/chat" element={<CopilotAgentPage />} />
//         <Route path="/admin/*" element={<Admin />} />
//         <Route path="/" element={<Navigate to="/chat" replace />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import React, { useEffect, useState } from 'react';
import SecondaryNav from './components/layout/SecondaryNav';
import TopBar from './components/layout/TopBar';
import ConversationsPanel from './components/conversations/ConversationsPanel';
import ChatPanel from './components/chat/ChatPanel';
import ContextPanel from './components/context/ContextPanel';
import WorkspacePage from './components/pages/WorkspacePage';
import { sessionsApi } from './data/sessionsApi';

const blankSession = () => ({ id: null, title: 'New conversation', messages: [], isNew: true });

export default function App() {
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [chatKey, setChatKey] = useState(0);
  const [toast, setToast] = useState('');
  const [activePage, setActivePage] = useState('conversations');
  const [sessions, setSessions] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(blankSession);
  const [bootstrap, setBootstrap] = useState({ currentUser: {}, navigation: [], conversationFilters: [], suggestedPrompts: [], referencedDocuments: [], relatedAgents: [], agents: [], users: [] });
  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(''), 2600);
  };
  const loadSessions = async () => {
    try { setSessions(await sessionsApi.list()); } catch { notify('Start the API with: npm run api'); }
  };
  useEffect(() => {
    loadSessions();
    sessionsApi.bootstrap().then(setBootstrap).catch((error) => notify(error.message));
  }, []);
  const newConversation = () => { setSelectedConversation(blankSession()); setChatKey((key) => key + 1); setActivePage('conversations'); notify('New conversation ready'); };
  const selectConversation = async (session) => {
    try { setSelectedConversation(await sessionsApi.get(session.id)); setChatKey((key) => key + 1); } catch (error) { notify(error.message); }
  };
  const handleSessionChange = (session) => { setSelectedConversation(session); loadSessions(); };
  const clearConversation = async () => { if (selectedConversation?.id) await sessionsApi.remove(selectedConversation.id); newConversation(); loadSessions(); };
  const archiveConversation = async () => {
    if (!selectedConversation?.id) return;
    await sessionsApi.update(selectedConversation.id, { archived: true, pinned: false });
    newConversation(); loadSessions(); notify('Conversation moved to archive');
  };
  const setConversationArchived = async (conversation, archived) => {
    try {
      await sessionsApi.update(conversation.id, { archived, ...(archived ? { pinned: false } : {}) });
      if (selectedConversation?.id === conversation.id) newConversation();
      await loadSessions(); notify(archived ? 'Conversation archived' : 'Conversation restored');
    } catch (error) { notify(error.message); }
  };
  const deleteConversation = async (conversation) => {
    try {
      await sessionsApi.remove(conversation.id);
      if (selectedConversation?.id === conversation.id) newConversation();
      await loadSessions(); notify('Conversation deleted');
    } catch (error) { notify(error.message); }
  };
  const openSearchResult = async (result) => {
    if (result.type === 'conversation') { setActivePage('conversations'); await selectConversation(result); }
    else if (result.type === 'agent') { setActivePage('agents'); notify(`${result.name} opened`); }
    else if (result.type === 'user') { setActivePage('users'); notify(`${result.name}'s profile opened`); }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f5f7] text-gray-900">
      {/* <SecondaryNav items={bootstrap.navigation} activeKey={activePage} onNavigate={setActivePage} onAction={notify} /> */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* <TopBar currentUser={bootstrap.currentUser} onResult={openSearchResult} onAction={notify} /> */}
        {activePage === 'conversations' ? <div className="flex min-h-0 flex-1">
          <ConversationsPanel filters={bootstrap.conversationFilters} conversations={sessions} selectedId={selectedConversation?.id} onNew={newConversation} onArchive={setConversationArchived} onDelete={deleteConversation} onAction={notify} onSelectConversation={selectConversation} />
          <ChatPanel key={chatKey} session={selectedConversation} suggestedPrompts={bootstrap.suggestedPrompts} currentUser={bootstrap.currentUser} onSessionChange={handleSessionChange} onChatActivity={() => setContextPanelOpen(false)} onAction={notify} onOpenContext={() => setContextPanelOpen(true)} />
          {/* {contextPanelOpen && <ContextPanel documents={selectedConversation?.sources || []} session={selectedConversation} onClose={() => setContextPanelOpen(false)} onAction={notify} onArchive={archiveConversation} onClear={clearConversation} />} */}
        </div> : <main className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#f6f7f9]">
          <WorkspacePage page={activePage} data={bootstrap} onAction={notify} onNavigate={setActivePage} /></main>}
      </div>
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">{toast}</div>}
    </div>
  );
}
