import React from 'react';
import { Zap, Shield, Clock, LineChart, Users } from 'lucide-react';
import levisbg from './levisbg.png';

const FeatureCard = ({ icon: Icon, title, description, delayText }) => (
  <div
    className={`p-4 bg-[#0f172a]/40 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_4px_24px_-8px_rgba(124,58,237,0.2)] hover:shadow-[0_8px_32px_-8px_rgba(124,58,237,0.4)] hover:border-[#7c3aed]/50 hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-default opacity-0 animate-fade-in-up ${delayText} relative overflow-hidden group`}
  >
    {/* Glow effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/30 to-[#7c3aed] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl"></div>

    <div className="relative z-10">
      <div className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#7c3aed]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-shadow">
        <Icon className="w-5 h-5 text-[#8b5cf6]" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-[#94a3b8] leading-relaxed group-hover:text-[#cbd5e1] transition-colors">
        {description}
      </p>
    </div>
  </div>
);

function App() {
  const features = [
    {
      icon: Zap,
      title: 'Instant Resolutions',
      description: 'Get answers in seconds with AI-powered diagnostics and automated workflows.',
      delayClass: '![animation-delay:200ms]'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade encryption with continuous data protection and privacy guardrails.',
      delayClass: '![animation-delay:300ms]'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Always-on support infrastructure ready to tackle robust IT requests anytime.',
      delayClass: '![animation-delay:400ms]'
    },
    {
      icon: LineChart,
      title: 'Intelligent Insights',
      description: 'Proactive issue detection mapping across standard operational ecosystems.',
      delayClass: '![animation-delay:500ms]'
    }
  ];

  return (
    <div
      className="flex h-screen w-full overflow-hidden flex-col md:flex-row text-[#1e293b] relative"
      style={{
        background: "radial-gradient(ellipse at top, #100e28 0%, #04040a 70%, #010103 100%)"
      }}
    >
      {/* Ambient glowing shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#7c3aed] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#d946ef] rounded-full mix-blend-screen filter blur-[120px] opacity-15 pointer-events-none"></div>

      {/* LEFT SIDE - UI Panel */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col relative z-10">
        {/* Bot Icon Overlay */}
        <div className="absolute top-0 right-4 h-14 flex items-center z-20">
          <div className="w-10 h-10 rounded-full bg-white backdrop-blur-md border border-[#7c3aed]/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:border-[#7c3aed]/60 transition-all duration-300 cursor-pointer group overflow-hidden">
            <img src={levisbg} alt="Bot Icon" className="w-10 h-6 object-cover group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Top Section: Brand Experience Panel (50% min-height) */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-12 min-h-[50vh] animate-fade-in">
          <div className="max-w-xl">
            <img src="/src/leviswhite.jpg" alt="Wipro Logo" className="h-12 w-auto object-contain mb-6" style={{ height: '120px', width: '180px' }} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
              Smarter Conversations.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#d946ef]">
                Faster Decisions.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#94a3b8] leading-relaxed max-w-lg mb-8">
              Resolve IT issues seamlessly with our intelligent, always-on assistant. Experience enterprise-grade support without the wait.
            </p>
          </div>
        </div>

        {/* Bottom Section: Feature Highlights Panel (50% min-height) */}
        <div className="px-8 md:px-16 pb-12 flex-grow flex flex-col justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delayText={feature.delayClass}
              />
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT SIDE - Chat Window */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full border-t md:border-t-0 md:border-l border-white/10 flex flex-col relative z-10">
        <div className="absolute inset-0 w-full h-full p-0">
          <div className="w-full h-full overflow-hidden relative bg-transparent">
            <iframe
              src="https://copilotstudio.microsoft.com/environments/Default-f5791d91-daca-4d28-8700-680f7a2f8b6a/bots/cr90a_itSupportAssistant/webchat?__version__=2"
              // frameBorder="0"
              className="w-full h-full bg-transparent"
              title="Copilot Chat Interface"
              allow="microphone; camera"
            />
            {/* Overlay */}
            <div className="absolute top-0 left-0 w-full h-14 bg-[#7c3aed] text-white font-bold flex items-center px-4 z-10">
              MyLiva
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;