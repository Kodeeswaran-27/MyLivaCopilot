// import React from 'react';
// import { Bot, Zap, Shield, Clock, LineChart, Users } from 'lucide-react';

// const FeatureCard = ({ icon: Icon, title, description, delayText }) => (
//   <div
//     className={`p-4 lg:p-5 bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-default opacity-0 animate-fade-in-up ${delayText} relative group overflow-hidden`}
//   >
//     <div className="absolute inset-0 bg-glow-effect opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
//     <div className="relative z-10">
//       <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-card-light flex items-center justify-center mb-3 lg:mb-4 border border-border shadow-inner">
//         <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
//       </div>
//       <h3 className="text-base lg:text-lg font-semibold text-themeText-main mb-1.5 lg:mb-2">{title}</h3>
//       <p className="text-xs lg:text-sm text-themeText-muted leading-relaxed">
//         {description}
//       </p>
//     </div>
//   </div>
// );

// function App() {
//   const features = [
//     {
//       icon: Zap,
//       title: 'Instant Resolutions',
//       description: 'Get answers in seconds with AI-powered diagnostics and automated workflows.',
//       delayClass: '![animation-delay:200ms]'
//     },
//     {
//       icon: Shield,
//       title: 'Secure & Compliant',
//       description: 'Enterprise-grade encryption with continuous data protection and privacy guardrails.',
//       delayClass: '![animation-delay:300ms]'
//     },
//     {
//       icon: Clock,
//       title: '24/7 Availability',
//       description: 'Always-on support infrastructure ready to tackle robust IT requests anytime.',
//       delayClass: '![animation-delay:400ms]'
//     },
//     {
//       icon: LineChart,
//       title: 'Intelligent Insights',
//       description: 'Proactive issue detection mapping across standard operational ecosystems.',
//       delayClass: '![animation-delay:500ms]'
//     }
//   ];

//   return (
//     <div className="flex h-screen w-full bg-main-gradient overflow-hidden flex-col md:flex-row relative">
//       {/* Ambient background shapes - spanning whole screen */}
//       <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-ambient-1 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob pointer-events-none z-0"></div>
//       <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-ambient-3 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-2000 pointer-events-none z-0"></div>
//       <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-ambient-2 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-4000 pointer-events-none z-0"></div>

//       {/* LEFT SIDE - UI Panel */}
//       <div className="w-full md:w-[60%] h-1/2 md:h-full flex flex-col relative bg-transparent overflow-hidden z-10">

//         {/* Top Section: Brand Experience Panel */}
//         <div className="relative z-10 flex flex-col justify-end px-8 md:px-12 lg:px-16 pt-8 pb-6 flex-[0.8] opacity-0 animate-fade-in">
//           <div className="max-w-xl">
//             <div className="inline-flex items-center space-x-2 bg-card-light text-primary border border-border px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase mb-4 shadow-sm">
//               <Bot className="w-4 h-4" />
//               <span>IT Support Assistant</span>
//             </div>

//             <h1 className="text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white tracking-tight leading-tight mb-4 drop-shadow-md">
//               MyLiva<br />
//             </h1>

//             <p className="text-base md:text-lg text-themeText-light leading-relaxed max-w-lg">
//               Your digital IT assistant. Resolve IT issues seamlessly with our intelligence, always-on assistant. Experience enterprise-grade support without the wait.
//             </p>
//           </div>
//         </div>

//         {/* Bottom Section: Feature Highlights Panel */}
//         <div className="relative z-10 px-8 md:px-12 lg:px-16 pb-8 flex-1 flex flex-col justify-start">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
//             {features.map((feature, idx) => (
//               <FeatureCard
//                 key={idx}
//                 icon={feature.icon}
//                 title={feature.title}
//                 description={feature.description}
//                 delayText={feature.delayClass}
//               />
//             ))}
//           </div>
//         </div>

//       </div>

//       {/* RIGHT SIDE - Chat Window */}
//       <div className="w-full md:w-[40%] h-1/2 md:h-full flex flex-col relative border-t md:border-t-0 md:border-l border-border bg-transparent z-10">
//         <div className="w-full h-full bg-card overflow-hidden relative">
//           <iframe
//             src="https://copilotstudio.microsoft.com/environments/Default-f5791d91-daca-4d28-8700-680f7a2f8b6a/bots/cr90a_itSupportAssistant/webchat?__version__=2"
//             frameBorder="0"
//             className="w-full h-full"
//             title="Copilot Chat Interface"
//             allow="microphone; camera"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import { useState, useEffect, useRef } from "react";

// ─── Direct Line Secret (move to backend in production) ──────────────────────
const DIRECT_LINE_SECRET = "-HMNIIsO44Y.2z8I-_xjzGGCmuxTAACGvXyHstouZnayTtbMVKqhFdo";
// ─────────────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: linear-gradient(135deg, #EBF2FF 0%, #F0F7FF 40%, #E8F4FD 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .page-bg {
    position: fixed; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 60% 50% at 70% 20%, rgba(26,86,219,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 20% 80%, rgba(14,165,233,0.07) 0%, transparent 70%),
      linear-gradient(160deg, #EBF3FF 0%, #F8FAFF 50%, #EDF4FD 100%);
  }

  /* ── NAVBAR ── */
  .navbar {
    position: relative; z-index: 10;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(26,86,219,0.1);
    padding: 0 2rem; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 20px; font-weight: 700; color: #1A56DB; letter-spacing: -0.5px;
  }
  .logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #1A56DB, #0EA5E9);
    display: flex; align-items: center; justify-content: center;
  }
  .nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; }
  .nav-links a { color: #475569; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
  .nav-links a:hover { color: #1A56DB; }
  .nav-cta {
    background: #1A56DB; color: #fff; border: none; cursor: pointer;
    padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
    font-family: inherit; transition: background 0.2s, transform 0.15s;
  }
  .nav-cta:hover { background: #1240A8; transform: translateY(-1px); }

  /* ── HERO ── */
  .hero {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 80px 2rem 60px;
    display: grid; grid-template-columns: 1fr 1fr;
    align-items: center; gap: 4rem;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(26,86,219,0.08); color: #1A56DB;
    border: 1px solid rgba(26,86,219,0.2); border-radius: 100px;
    padding: 4px 14px; font-size: 12px; font-weight: 600;
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;
  }
  .hero h1 {
    font-size: 46px; font-weight: 700; line-height: 1.12;
    color: #0F172A; letter-spacing: -1.5px; margin-bottom: 18px;
  }
  .hero h1 span {
    background: linear-gradient(135deg, #1A56DB, #0EA5E9);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .hero-sub { font-size: 17px; color: #475569; line-height: 1.65; margin-bottom: 32px; max-width: 440px; }
  .hero-actions { display: flex; gap: 12px; align-items: center; }
  .btn-primary {
    background: #1A56DB; color: #fff; border: none; cursor: pointer;
    padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 600;
    font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover { background: #1240A8; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,86,219,0.3); }
  .btn-secondary {
    background: transparent; color: #1A56DB;
    border: 1.5px solid rgba(26,86,219,0.3); cursor: pointer;
    padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 600;
    font-family: inherit; transition: all 0.2s;
  }
  .btn-secondary:hover { background: rgba(26,86,219,0.05); border-color: #1A56DB; }
  .hero-stats { display: flex; gap: 28px; margin-top: 36px; }
  .stat { display: flex; flex-direction: column; }
  .stat-val { font-size: 26px; font-weight: 700; color: #0F172A; }
  .stat-lab { font-size: 12px; color: #94A3B8; font-weight: 500; margin-top: 2px; }

  /* ── HERO BOT CARD ── */
  .hero-visual { position: relative; }
  .hero-bot-card {
    border-radius: 20px;
    border: 1px solid rgba(26,86,219,0.14);
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(26,86,219,0.13), 0 4px 16px rgba(0,0,0,0.06);
    height: 540px;
    display: flex; flex-direction: column;
    background: #fff;
  }
  .hero-bot-body { flex: 1; overflow: hidden; position: relative; }

  /* ── FEATURES ── */
  .features-section {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto; padding: 40px 2rem 80px;
  }
  .section-label { text-align: center; font-size: 12px; font-weight: 600; color: #1A56DB; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .section-title { text-align: center; font-size: 32px; font-weight: 700; color: #0F172A; letter-spacing: -0.8px; margin-bottom: 8px; }
  .section-sub { text-align: center; font-size: 16px; color: #64748B; margin-bottom: 48px; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .feature-card {
    background: rgba(255,255,255,0.8); border: 1px solid rgba(26,86,219,0.1);
    border-radius: 16px; padding: 28px 24px; transition: all 0.25s;
  }
  .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(26,86,219,0.1); border-color: rgba(26,86,219,0.2); background: #fff; }
  .feature-icon { width: 48px; height: 48px; border-radius: 12px; background: #EBF2FF; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 22px; }
  .feature-title { font-size: 15px; font-weight: 600; color: #0F172A; margin-bottom: 8px; }
  .feature-desc { font-size: 14px; color: #64748B; line-height: 1.6; }

  /* ── LAUNCHER ── */
  .chat-launcher { position: fixed; bottom: 24px; right: 24px; z-index: 1000; }
  .launcher-btn {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, #1A56DB, #1E67F0);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 24px rgba(26,86,219,0.45); transition: all 0.25s; position: relative;
  }
  .launcher-btn:hover { transform: scale(1.08); box-shadow: 0 10px 32px rgba(26,86,219,0.5); }
  .launcher-btn.open { background: linear-gradient(135deg, #475569, #334155); }
  .notif-badge {
    position: absolute; top: -4px; right: -4px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #EF4444; color: #fff; font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; border: 2px solid #fff;
  }

  /* ── CHAT WINDOW ── */
  .chat-window {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1001;
    width: 100%; height: 100%;
    border-radius: 0; border: none;
    background: #fff; overflow: hidden;
    display: flex; flex-direction: column;
    animation: fadeIn 0.22s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  @media (min-width: 540px) {
    .chat-window {
      top: auto; left: auto;
      bottom: 96px; right: 24px;
      width: 420px; height: 680px;
      border-radius: 20px;
      border: 1px solid rgba(26,86,219,0.15);
      box-shadow: 0 28px 72px rgba(0,0,0,0.18), 0 4px 20px rgba(26,86,219,0.14);
      animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: scale(0.88) translateY(24px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* slim close bar at top of popup */
  .chat-close-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px;
    background: linear-gradient(135deg, #1A56DB 0%, #1E6AF2 100%);
    flex-shrink: 0;
  }
  .chat-close-bar-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: #fff;
  }
  .chat-close-bar-status {
    font-size: 11px; color: rgba(255,255,255,0.75);
    display: flex; align-items: center; gap: 4px; margin-top: 1px;
  }
  .chat-close-btn {
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(255,255,255,0.18); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .chat-close-btn:hover { background: rgba(255,255,255,0.32); }

  /* ── WEB CHAT CONTAINER ── */
  .webchat-container {
    flex: 1; overflow: hidden; position: relative;
  }
  .webchat-container > div {
    width: 100% !important;
    height: 100% !important;
  }

  /* ── LOADING STATE ── */
  .bot-loading {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    background: #F8FAFF;
  }
  .bot-loading-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid #E2E8F0;
    border-top-color: #1A56DB;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .bot-loading-text { font-size: 13px; color: #94A3B8; font-weight: 500; }

  /* ── ERROR STATE ── */
  .bot-error {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    background: #F8FAFF; padding: 24px; text-align: center;
  }
  .bot-error-icon { font-size: 32px; }
  .bot-error-title { font-size: 15px; font-weight: 600; color: #0F172A; }
  .bot-error-msg { font-size: 13px; color: #64748B; line-height: 1.6; }
  .bot-retry-btn {
    margin-top: 8px; background: #1A56DB; color: #fff;
    border: none; cursor: pointer; padding: 9px 20px;
    border-radius: 8px; font-size: 13px; font-weight: 600;
    font-family: inherit; transition: background 0.2s;
  }
  .bot-retry-btn:hover { background: #1240A8; }

  /* ── FOOTER ── */
  .chat-footer {
    padding: 7px 14px;
    border-top: 1px solid #F1F5F9;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; background: #fff;
  }
  .powered-by { font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 5px; }
  .powered-logo { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #1A56DB; }
`;

const FEATURES = [
  { icon: "⚡", title: "Instant IT support", desc: "Get real-time answers to your IT queries — no waiting in queue, no ticket delays." },
  { icon: "🔒", title: "Secure & authenticated", desc: "Enterprise-grade security with authenticated sessions powered by Microsoft Copilot Studio." },
  { icon: "🧠", title: "AI-powered resolution", desc: "Smart context-aware responses that learn and adapt to your organisation's needs." },
  { icon: "🔄", title: "24/7 availability", desc: "Round-the-clock support that never sleeps — resolve issues anytime, anywhere." },
  { icon: "📋", title: "Ticket integration", desc: "Automatically creates and tracks support tickets when issues need human escalation." },
  { icon: "📊", title: "Usage insights", desc: "Real-time analytics on support trends, resolution rates, and employee satisfaction." },
];

// ── Bot Web Chat Component (loads Microsoft Bot Framework SDK) ────────────────
function BotWebChat({ containerId }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [retryKey, setRetryKey] = useState(0);
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    // Load Bot Framework Web Chat SDK from CDN
    const scriptId = "bf-webchat-sdk";
    const loadSDK = () =>
      new Promise((resolve, reject) => {
        if (window.WebChat) return resolve();
        if (document.getElementById(scriptId)) {
          // already loading — wait for it
          const interval = setInterval(() => {
            if (window.WebChat) { clearInterval(interval); resolve(); }
          }, 100);
          return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdn.botframework.com/botframework-webchat/latest/webchat.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

    const init = async () => {
      try {
        await loadSDK();
        if (cancelled) return;

        // Use Direct Line secret directly
        const directLine = window.WebChat.createDirectLine({
          secret: DIRECT_LINE_SECRET,
        });

        const styleOptions = {
          // Colors
          accent: "#1A56DB",
          botAvatarBackgroundColor: "#1A56DB",
          userAvatarBackgroundColor: "#1A56DB",
          // Bot avatar initials
          botAvatarInitials: "ML",
          userAvatarInitials: "You",
          // Bubbles
          bubbleBackground: "#F1F5F9",
          bubbleBorderRadius: 12,
          bubbleBorderWidth: 0,
          bubbleFromUserBackground: "#1A56DB",
          bubbleFromUserBorderRadius: 12,
          bubbleFromUserBorderWidth: 0,
          bubbleFromUserTextColor: "#ffffff",
          bubbleTextColor: "#1E293B",
          // Send box
          sendBoxBackground: "#ffffff",
          sendBoxBorderBottom: "1px solid #E2E8F0",
          sendBoxBorderLeft: "none",
          sendBoxBorderRight: "none",
          sendBoxBorderTop: "1px solid #E2E8F0",
          sendBoxButtonColor: "#1A56DB",
          sendBoxHeight: 52,
          sendBoxTextColor: "#0F172A",
          // Fonts
          primaryFont: "'Plus Jakarta Sans', sans-serif",
          // Timestamp
          timestampColor: "#94A3B8",
          // Hide upload button for cleanliness
          hideUploadButton: true,
        };

        const el = document.getElementById(containerId);
        if (!el || cancelled) return;

        window.WebChat.renderWebChat(
          { directLine, styleOptions, locale: "en-US" },
          el
        );

        cleanupRef.current = () => { try { directLine.end(); } catch (_) { } };
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("BotWebChat init error:", err);
        if (!cancelled) setStatus("error");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
    };
  }, [retryKey, containerId]);

  return (
    <>
      {status === "loading" && (
        <div className="bot-loading">
          <div className="bot-loading-spinner" />
          <span className="bot-loading-text">Connecting to MyLiva assistant…</span>
        </div>
      )}
      {status === "error" && (
        <div className="bot-error">
          <div className="bot-error-icon">⚠️</div>
          <div className="bot-error-title">Couldn't connect</div>
          <p className="bot-error-msg">
            Make sure your Token Endpoint is correct and the bot is published in Copilot Studio.
          </p>
          <button className="bot-retry-btn" onClick={() => setRetryKey(k => k + 1)}>
            Retry
          </button>
        </div>
      )}
      <div
        id={containerId}
        ref={containerRef}
        style={{
          width: "100%", height: "100%",
          display: status === "ready" ? "block" : "none",
        }}
      />
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function MyLivaApp() {
  const [chatOpen, setChatOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(true);

  const handleOpen = () => { setChatOpen(true); setShowBadge(false); };

  return (
    <>
      <style>{styles}</style>
      <div className="page-bg" />

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v9h5v-5h4v5h5V7L10 2z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          MyLiva
        </div>
        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Support</a></li>
          <li><a href="#">Knowledge Base</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
        <button className="nav-cta" onClick={handleOpen}>Open Support Chat</button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4" /></svg>
            AI-Powered IT Support
          </div>
          <h1>Smart support,<br /><span>zero friction</span></h1>
          <p className="hero-sub">
            MyLiva's AI assistant resolves IT issues instantly — from password resets to software
            troubleshooting — so your team stays productive.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={handleOpen}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.13 1 1 3.91 1 7.5c0 1.67.63 3.2 1.67 4.37L1.5 14.5l3.1-1.02A7.2 7.2 0 0 0 8 14c3.87 0 7-2.91 7-6.5S11.87 1 8 1z" fill="white" />
              </svg>
              Chat with IT Support
            </button>
            <button className="btn-secondary">Learn more</button>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-val">98%</span><span className="stat-lab">Resolution rate</span></div>
            <div className="stat"><span className="stat-val">&lt;30s</span><span className="stat-lab">Avg. response time</span></div>
            <div className="stat"><span className="stat-val">24/7</span><span className="stat-lab">Always available</span></div>
          </div>
        </div>

        {/* Live bot embedded in hero — no iframe, no CORS */}
        <div className="hero-visual">
          <div className="hero-bot-card">
            <div className="hero-bot-body">
              <BotWebChat containerId="hero-webchat" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="section-label">Why MyLiva</div>
        <h2 className="section-title">Everything your IT team needs</h2>
        <p className="section-sub">Built on Microsoft Copilot Studio for enterprise reliability and security.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOATING CHAT POPUP ── */}
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-close-bar">
            <div>
              <div className="chat-close-bar-title">
                🤖 MyLiva IT Assistant
              </div>
              <div className="chat-close-bar-status">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                Online · Powered by Copilot Studio
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setChatOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="webchat-container">
            <BotWebChat containerId="popup-webchat" />
          </div>

          <div className="chat-footer">
            <span className="powered-by">
              Powered by&nbsp;
              <span className="powered-logo">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect width="5.5" height="5.5" fill="#1A56DB" />
                  <rect x="6.5" width="5.5" height="5.5" fill="#0EA5E9" />
                  <rect y="6.5" width="5.5" height="5.5" fill="#10B981" />
                  <rect x="6.5" y="6.5" width="5.5" height="5.5" fill="#6366F1" />
                </svg>
                MyLiva × Copilot Studio
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── FLOATING LAUNCHER ── */}
      <div className="chat-launcher">
        <button
          className={`launcher-btn${chatOpen ? " open" : ""}`}
          onClick={chatOpen ? () => setChatOpen(false) : handleOpen}
          title={chatOpen ? "Close chat" : "Open IT Support Chat"}
        >
          {showBadge && !chatOpen && <span className="notif-badge">1</span>}
          {chatOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C7.03 3 3 6.81 3 11.5c0 2.08.77 3.99 2.05 5.48L3.5 20.5l4.17-1.37A9.4 9.4 0 0 0 12 20c4.97 0 9-3.81 9-8.5S16.97 3 12 3z" fill="white" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
