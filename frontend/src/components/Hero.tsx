export const Hero = () => {
  return (
    <section id="hero" className="w-full max-w-[90%] mx-auto pt-16 pb-12 text-center relative z-20">
      
      {/* Premium Ambient Light Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10 animate-fadeIn">
        
        {/* Dynamic Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 border border-slate-300/80 text-slate-700 text-[10px] font-mono tracking-wider uppercase mb-5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-bold select-none">//</span>
          <span>Universal AI Credits</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#121118] leading-[1.05] uppercase">
          One wallet. <br className="hidden md:block"/>
          <span className="text-slate-400 block my-2 md:my-3">Every model.</span> Zero key juggling.
        </h1>

        <p className="text-xs md:text-sm text-slate-600 mt-5 max-w-xl font-mono leading-relaxed uppercase">
          A liquid clearinghouse for AI compute. Top up once, route requests to OpenAI, Anthropic & Gemini through a single credit pool — burned in real time, per token, with margin.
        </p>

        {/* Floating Core Statistics Row */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-10 w-full max-w-2xl border-t border-b border-slate-200/80 py-4 font-mono text-[9px] md:text-xs text-slate-500 uppercase tracking-wide">
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-400">// LATENCY</span>
            <span className="font-black text-slate-800 mt-1">&lt;0.8ms checks</span>
          </div>
          <div className="flex flex-col items-center border-l border-r border-slate-200">
            <span className="font-bold text-slate-400">// DISPATCH</span>
            <span className="font-black text-slate-800 mt-1">Multi-model</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-400">// UPTIME SLA</span>
            <span className="font-black text-slate-800 mt-1">99.99% active</span>
          </div>
        </div>
      
      </div>
    </section>
  );
};
