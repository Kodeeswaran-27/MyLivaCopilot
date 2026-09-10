import React, { useState, useEffect, useRef } from 'react';
import { Bot, Settings, HelpCircle, Save, ExternalLink, Info, Check, RefreshCw, Key, ShieldAlert } from 'lucide-react';

export default function CopilotAgentPage({ onAction }) {
  // Pre-load the user's Direct Line Security Key as the default
  const defaultKey = 'SvKJY8sOmOM.M9oQqB3MYdsR3yLxqBgYValpixBtouMTfZBqWhduaFA';
  
  const [connectionString, setConnectionString] = useState(() => {
    return localStorage.getItem('copilotUrl') || defaultKey;
  });
  const [inputValue, setInputValue] = useState(connectionString);
  const [showConfig, setShowConfig] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [webChatLoaded, setWebChatLoaded] = useState(false);
  const [error, setError] = useState('');
  
  const webChatRef = useRef(null);

  // Detect connection type: 'secret' (direct line key) vs 'url' (iframe link)
  const isUrl = connectionString.startsWith('http://') || connectionString.startsWith('https://');
  const isSecret = connectionString && !isUrl;

  // Load Bot Framework Web Chat CDN script dynamically if using Direct Line Secret
  useEffect(() => {
    if (!isSecret) return;

    if (window.WebChat) {
      setWebChatLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.botframework.com/botframework-webchat/latest/webchat.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      setWebChatLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load the Microsoft Bot Framework Web Chat interface.');
    };
    document.body.appendChild(script);
  }, [isSecret]);

  // Initialize and Render Web Chat client when script is loaded and secret is active
  useEffect(() => {
    if (isSecret && webChatLoaded && webChatRef.current && window.WebChat) {
      try {
        // Clear container first
        webChatRef.current.innerHTML = '';
        
        window.WebChat.renderWebChat(
          {
            directLine: window.WebChat.createDirectLine({ secret: connectionString }),
            styleOptions: {
              bubbleBorderRadius: 12,
              bubbleFromUserBorderRadius: 12,
              bubbleBackground: '#f1f5f9',
              bubbleTextColor: '#0f172a',
              bubbleFromUserBackground: '#6366f1', // Indigo-500
              bubbleFromUserTextColor: '#ffffff',
              sendBoxButtonColor: '#6366f1',
              sendBoxHeight: 50,
              botAvatarInitials: 'Bot',
              userAvatarInitials: 'You',
              botAvatarBackgroundColor: '#e0e7ff', // Indigo-100
              botAvatarTextColor: '#6366f1',
              userAvatarBackgroundColor: '#f1f5f9',
              userAvatarTextColor: '#475569',
              hideUploadButton: true
            }
          },
          webChatRef.current
        );
      } catch (err) {
        console.error(err);
        setError('Error establishing direct line channel connection.');
      }
    }
  }, [isSecret, webChatLoaded, connectionString]);

  const handleSave = (e) => {
    e.preventDefault();
    const cleanString = inputValue.trim();
    localStorage.setItem('copilotUrl', cleanString);
    setConnectionString(cleanString);
    setIsSaved(true);
    setError('');
    onAction?.('Connection settings updated successfully');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset to default security key?')) {
      localStorage.removeItem('copilotUrl');
      setConnectionString(defaultKey);
      setInputValue(defaultKey);
      setError('');
      onAction?.('Configuration reset');
    }
  };

  const reloadChat = () => {
    if (isSecret) {
      setWebChatLoaded(false);
      setTimeout(() => setWebChatLoaded(true), 100);
    } else {
      // Force iframe refresh
      const current = connectionString;
      setConnectionString('');
      setTimeout(() => setConnectionString(current), 50);
    }
    onAction?.('Copilot agent session refreshed');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-slate-50">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Copilot Agent</h1>
            <p className="text-xs text-slate-500">
              {isSecret ? 'Connected via Direct Line API Channel' : 'Connected via Web Chat Embed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            title="Reload Connection"
          >
            <RefreshCw size={14} />
            <span>Reload Session</span>
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              showConfig
                ? 'border-violet-600 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings size={14} />
            <span>Connection Settings</span>
          </button>
        </div>
      </div>

      {/* Configuration drawer */}
      {showConfig && (
        <div className="border-b border-slate-200 bg-white px-8 py-5 shadow-inner">
          <form onSubmit={handleSave} className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-violet-600" />
              <h2 className="text-sm font-bold text-slate-800">Bot Channel Configuration</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Paste your Microsoft Copilot Studio Direct Line Security Key / Secret (e.g. SvKJY...) or paste a Web Chat iframe URL.
            </p>

            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste Security Key (Direct Line Secret) or iframe URL..."
                required
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition"
              >
                {isSaved ? <Check size={16} /> : <Save size={16} />}
                <span>{isSaved ? 'Saved' : 'Save Connection'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Reset Default
              </button>
            </div>

            {isSecret && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <p>
                  <strong>Security Note:</strong> You are currently using a Direct Line Secret in client-side storage. For production environments, it is recommended to set up a server-side token exchange to prevent exposing your secret.
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Main chat client window */}
      <div className="flex-grow overflow-hidden p-6">
        {error ? (
          <div className="mx-auto flex h-full max-w-md flex-col justify-center text-center text-rose-600">
            <p className="font-bold">Connection Failed</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              onClick={reloadChat}
              className="mx-auto mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
            >
              Try Again
            </button>
          </div>
        ) : isUrl ? (
          /* Render Iframe View if connectionString is an iframe URL */
          <div className="h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {connectionString && (
              <iframe
                src={connectionString}
                frameBorder="0"
                style={{ width: '100%', height: '100%' }}
                allow="microphone; geolocation"
                title="Microsoft Copilot Studio Webchat"
                className="h-full w-full"
              />
            )}
          </div>
        ) : (
          /* Render Native Web Chat wrapper using CDN script if connectionString is Direct Line secret */
          <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {!webChatLoaded ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-violet-500" />
                <span className="text-xs">Establishing Secure Direct Line Channel...</span>
              </div>
            ) : (
              <div ref={webChatRef} className="h-full w-full" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
