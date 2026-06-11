export const Hero = () => {
  return (
    <section className="w-full max-w-[90%] mx-auto pt-16 pb-12 text-center relative z-20">
      
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/50 border border-slate-300 text-slate-700 text-[10px] font-mono tracking-wider uppercase mb-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg> // Universal Ai Credits
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#121118] leading-[1.05] uppercase">
          One wallet. <br className="hidden md:block"/>
          <span className="text-slate-400 block my-2 md:my-3">Every model.</span> Zero key juggling.
        </h1>

        <p className="text-xs md:text-sm text-slate-600 mt-5 max-w-xl font-mono leading-relaxed uppercase">
          A liquid clearinghouse for AI compute. Top up once, route requests to OpenAI, Anthropic & Gemini through a single credit pool — burned in real time, per token, with margin.
        </p>
      
      </div>
    </section>
    
  );
};
