import { useState, useEffect, useRef } from "react";
import { Hero } from "../components/Hero.tsx";

// ==========================================
// BRAND VECTOR ICONS & CUSTOM LOGOS
// ==========================================
const Icons = {
  Sparkles: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  GridToggle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Cpu: () => (
    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  ),
  Code: () => (
    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
};

// ==========================================
// MODELS LIST CONFIGURATION
// ==========================================
const MODELS_LIST = [
  { id: "gpt-4o", provider: "OpenAI", name: "GPT-4o (Chat/Text)", inputCost: 5.0, outputCost: 15.0, unit: "M tokens", color: "text-emerald-700 bg-emerald-100/60 border-emerald-300" },
  { id: "claude-3-5-sonnet", provider: "Anthropic", name: "Claude 3.5 Sonnet", inputCost: 3.0, outputCost: 15.0, unit: "M tokens", color: "text-amber-700 bg-amber-100/60 border-amber-300" },
  { id: "flux-1-dev", provider: "Flux", name: "Flux.1 Dev (Images)", inputCost: 30.0, outputCost: 30.0, unit: "Gen", color: "text-indigo-700 bg-indigo-100/60 border-indigo-300" },
  { id: "eleven-labs-v2", provider: "ElevenLabs", name: "ElevenLabs (Voice)", inputCost: 2.0, outputCost: 2.0, unit: "Sec", color: "text-pink-700 bg-pink-100/60 border-pink-300" }
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const TEST_USER_ID = 98765;

export default function Home() {
  // --- STATES ---
  const [balance, setBalance] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState(MODELS_LIST[0]);
  const [promptInput, setPromptInput] = useState("Explain multi-agent compute scaling in one simple sentence.");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [systemLogs, setSystemLogs] = useState<{ time: string; type: string; msg: string }[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const showBlueprintLines = true;
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [activeTab, setActiveTab] = useState<"node" | "python">("node");

  // --- Calculator & FAQ States ---
  const [calcInputTokens, setCalcInputTokens] = useState<number>(500000);
  const [calcOutputTokens, setCalcOutputTokens] = useState<number>(100000);
  const [calcImages, setCalcImages] = useState<number>(15);
  const [calcAudio, setCalcAudio] = useState<number>(120);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // --- Agent API Keys States ---
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: "Production Gateway Agent", key: `ch_live_key_98765_p7a89`, created: "2026-06-11", status: "active" },
    { id: 2, name: "Local Development Sandbox", key: `ch_dev_key_98765_s4b21`, created: "2026-06-12", status: "active" }
  ]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("default");

  // --- Provider Vault States ---
  const [vaultOpenAI, setVaultOpenAI] = useState(localStorage.getItem("vault_openai") || "");
  const [vaultAnthropic, setVaultAnthropic] = useState(localStorage.getItem("vault_anthropic") || "");
  const [openaiConnected, setOpenaiConnected] = useState(!!localStorage.getItem("vault_openai"));
  const [anthropicConnected, setAnthropicConnected] = useState(!!localStorage.getItem("vault_anthropic"));

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const formatBalance = (bal: number) => {
    const total = (bal / 1000000).toFixed(4);
    const [integerPart, decimalPart] = total.split(".");
    return (
      <span className="font-mono text-sm md:text-base font-bold text-slate-900">
        ${integerPart}
        <span className="text-[11px] md:text-xs text-slate-400 font-bold">.{decimalPart}</span>
      </span>
    );
  };

  // Sync state between client UI and backend database/cache pools
  const fetchBalanceAndLedger = async () => {
    try {
      const balRes = await fetch(`${API_BASE_URL}/v1/wallet/balance`, {
        headers: { "x-user-id": String(TEST_USER_ID) }
      });
      if (balRes.ok) {
        const data = await balRes.json();
        setBalance(data.balance);
      }

      const ledRes = await fetch(`${API_BASE_URL}/v1/wallet/ledger`, {
        headers: { "x-user-id": String(TEST_USER_ID) }
      });
      if (ledRes.ok) {
        const data = await ledRes.json();
        setLedger(data.ledger || []);
      }
    } catch (error) {
      console.error("[Home] Telemetry sync error:", error);
    }
  };

  useEffect(() => {
    fetchBalanceAndLedger();

    // Check backend telemetry periodically (reflects worker logs in UI)
    const interval = setInterval(fetchBalanceAndLedger, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [systemLogs]);

  // --- TRIGGER SANDBOX PROXY STREAM ---
  const handleExecuteSandbox = async () => {
    if (isStreaming) return;
    if (balance <= 0) {
      alert("Simulated balance is depleted! Add credits using the 'Top Up' module.");
      return;
    }

    setIsStreaming(true);
    setSystemLogs([]);
    setStreamText("");

    // Output immediate console telemetry traces
    setSystemLogs(prev => [...prev, { time: "0.0ms", type: "system", msg: "📡 [HTTP Ingress] API request received at POST /v1/chat/completions" }]);
    
    if (selectedApiKey === "default") {
      setSystemLogs(prev => [...prev, { time: "0.4ms", type: "redis", msg: `🧠 [Redis Guardrail] Checking credit balance... key: [wallet:${TEST_USER_ID}:balance]` }]);
    } else {
      const visiblePrefix = selectedApiKey.substring(0, 15);
      const visibleSuffix = selectedApiKey.substring(selectedApiKey.length - 5);
      const maskedKey = `${visiblePrefix}...${visibleSuffix}`;
      setSystemLogs(prev => [...prev, { time: "0.4ms", type: "redis", msg: `🧠 [Redis Guardrail] Checking key authorization: [${maskedKey}]` }]);
    }

    try {
      const targetUserIdHeader = selectedApiKey === "default" ? String(TEST_USER_ID) : selectedApiKey;
      const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": targetUserIdHeader
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [{ role: "user", content: promptInput }],
          stream: true
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Access denied";
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.message || parsed.error || errMsg;
        } catch {}

        setSystemLogs(prev => [...prev, { time: "Error", type: "redis", msg: `❌ [Rejected] ${errMsg}` }]);
        setIsStreaming(false);
        return;
      }

      setSystemLogs(prev => [...prev, { time: "3.5ms", type: "success", msg: "✅ [Authorized] Credit balance verified. Active pool handshake granted." }]);
      setSystemLogs(prev => [...prev, { time: "7.2ms", type: "gateway", msg: `🌐 [Proxy Route] Dispatching payload securely to foundation provider: ${selectedModel.provider}` }]);
      setSystemLogs(prev => [...prev, { time: "42.0ms", type: "stream", msg: "🌊 [SSE Connection] Stream channel opened. Parsing buffer packages..." }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("No response body stream reader available");
      }

      let done = false;
      let accumulatedText = "";
      let streamBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          streamBuffer += decoder.decode(value, { stream: !done });
          const lines = streamBuffer.split("\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data:")) {
              const dataVal = cleanLine.slice(5).trim();
              if (dataVal === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataVal);
                
                if (selectedModel.provider.toLowerCase() === "openai") {
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    accumulatedText += parsed.choices[0].delta.content;
                    setStreamText(accumulatedText);
                  }
                  if (parsed.usage) {
                    const usage = parsed.usage;
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "system", msg: `📊 [Billing Standard] Usage: ${usage.prompt_tokens} input, ${usage.completion_tokens} output tokens.` }]);
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "redis", msg: "💸 [Atomic Redis DECR] Balance decremented." }]);
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "postgres", msg: "📥 [Ledger Synchronizer] Async sync event enqueued." }]);
                  }
                } else if (selectedModel.provider.toLowerCase() === "anthropic") {
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    accumulatedText += parsed.delta.text;
                    setStreamText(accumulatedText);
                  } else if (parsed.type === "message_delta" && parsed.usage) {
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "system", msg: `📊 [Billing Standard] Usage: ${parsed.usage.output_tokens || 0} output tokens.` }]);
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "redis", msg: "💸 [Atomic Redis DECR] Balance decremented." }]);
                    setSystemLogs(prev => [...prev, { time: "Stream", type: "postgres", msg: "📥 [Ledger Synchronizer] Async sync event enqueued." }]);
                  }
                } else {
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    accumulatedText += parsed.choices[0].delta.content;
                    setStreamText(accumulatedText);
                  } else if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    accumulatedText += parsed.delta.text;
                    setStreamText(accumulatedText);
                  }
                }
              } catch {}
            }
          }
        }
      }

      // Display mock links if media providers were selected
      if (selectedModel.provider.toLowerCase() === "flux") {
        setStreamText("🎨 [Image Pipeline Output] image_generation_complete.png");
      } else if (selectedModel.provider.toLowerCase() === "elevenlabs") {
        setStreamText("🔊 [Voice Pipeline Output] voice_segment_output.wav");
      }

      // Re-trigger balance poll immediately
      setTimeout(fetchBalanceAndLedger, 500);

    } catch (err: any) {
      console.error("Stream reader execution failure:", err);
      setSystemLogs(prev => [...prev, { time: "Err", type: "system", msg: `❌ Stream error: ${err.message}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  // --- SUBMIT DEPOSIT TOP-UP ---
  const handleTopUpConfirm = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    const amountInMicroCredits = Math.round(amount * 1000000);

    try {
      const res = await fetch(`${API_BASE_URL}/v1/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(TEST_USER_ID)
        },
        body: JSON.stringify({ amount: amountInMicroCredits })
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        setShowTopUpModal(false);
        fetchBalanceAndLedger();
      } else {
        alert("Failed to confirm wallet deposit.");
      }
    } catch (error) {
      console.error("[Home] Top up error:", error);
      alert("Network connectivity issue topping up.");
    }
  };

  // --- INSTANT TEST CREDIT GRANTER ---
  const handleInstantTopUp = async () => {
    const amountInMicroCredits = 100000000; // $100.00 USD
    try {
      const res = await fetch(`${API_BASE_URL}/v1/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(TEST_USER_ID)
        },
        body: JSON.stringify({ amount: amountInMicroCredits })
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        fetchBalanceAndLedger();
      } else {
        console.error("[Home] Instant top up failed");
      }
    } catch (error) {
      console.error("[Home] Instant top up error:", error);
    }
  };

  const codeSnippets = {
    node: `import OpenAI from 'openai';
 
const client = new OpenAI({
  baseURL: '${API_BASE_URL}/v1',
  apiKey: 'ch_dev_key_${TEST_USER_ID}' // Universal balance API key
});
 
// Execute any foundation model without key exhaustion
const response = await client.chat.completions.create({
  model: '${selectedModel.id}',
  messages: [{ role: 'user', content: 'Unify my compute API keys.' }],
  headers: { 'x-user-id': '${TEST_USER_ID}' }
});`,
    python: `from openai import OpenAI
 
client = OpenAI(
    base_url="${API_BASE_URL}/v1",
    api_key="ch_dev_key_${TEST_USER_ID}" # Universal balance API key
)
 
# Call diverse platform architectures
response = client.chat.completions.create(
    model="${selectedModel.id}",
    messages=[{"role": "user", "content": "Unify my compute API keys."}],
    extra_headers={"x-user-id": "${TEST_USER_ID}"}
)`
  };

  return (
    <div className="min-h-screen bg-[#F1EFEA] text-[#121118] font-sans antialiased overflow-x-hidden flex flex-col relative">
      {showBlueprintLines && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.35] select-none z-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(18, 17, 24, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(18, 17, 24, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />
      )}

      {/* HEADER */}
      <header className="w-full max-w-[90%] mx-auto py-5 flex items-center justify-between border-b border-slate-200 relative z-20">
        <a href="#hero" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded bg-[#121118] text-[#F1EFEA] flex items-center justify-center font-bold font-mono tracking-tighter shadow">
             U    
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black tracking-widest text-sm text-[#121118]">UNIVERSAL-CRED</span>
            </div>
          </div>
        </a>

        {/* Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-6 text-[10px] font-mono font-bold text-slate-500">
          <a href="#playground" className="hover:text-[#121118] transition-colors">// Sandbox</a>
          <a href="#how-it-works" className="hover:text-[#121118] transition-colors">// Architecture</a>
          <a href="#agent-keys" className="hover:text-[#121118] transition-colors">// Credentials</a>
          <a href="#cost-estimator" className="hover:text-[#121118] transition-colors">// Cost Calculator</a>
          <a href="#about" className="hover:text-[#121118] transition-colors">// About</a>
          <a href="#faq" className="hover:text-[#121118] transition-colors">// F.A.Q</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Universal Wallet Balance Widget */}
          <div className="bg-white/80 border border-slate-200 rounded-xl py-1.5 px-3.5 flex items-center gap-3 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-bold">UNIVERSAL CORES</span>
              <div className="flex items-baseline gap-1">
                {formatBalance(balance)}
                <span className="text-[10px] text-slate-400 font-mono font-bold">USD</span>
              </div>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              + Top Up
            </button>
          </div>
        </div>
      </header>

      {/* HERO INTRODUCTION */}
      <Hero />

      {/* PROVIDERS STRIP */}
      <section className="w-full border-t border-b border-slate-200/80 bg-white/40 py-6 relative z-20 overflow-hidden">
        <div className="max-w-[90%] mx-auto flex flex-wrap items-center justify-around gap-6 opacity-65 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-widest text-slate-700">
            <span>●</span> OPENAI
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-widest text-slate-700">
            <span>●</span> ANTHROPIC
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-widest text-slate-700">
            <span>●</span> ELEVENLABS
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-widest text-slate-700">
            <span>●</span> MIDJOURNEY
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-widest text-slate-700">
            <span>●</span> REPLICATE
          </div>
        </div>
      </section>

      {/* SPLIT PANEL SECTION */}
      <section id="playground" className="w-full max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 relative z-20">

        {/* LEFT COLUMN: THE BLUEPRINT MARKETING & PERSISTENT LEDGER LOGS */}
        <div className="lg:col-span-5 flex flex-col justify-start pr-0 lg:pr-6 gap-6">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// PLATFORM BOUNDARY SOLUTION</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight text-[#121118]">
              ONE LIQUID WALLET. <br />
              INFINITE MULTI-MODELS.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Managing 15 API bills and locking up capital across minimum deposits is exhausting.
              Clearinghouse creates a unified settlement layer. When an AI agent executes compute,
              our middleware translates raw token consumption metrics back to your universal wallet in sub-milliseconds.
            </p>

            <ul className="mt-2 flex flex-col gap-3 text-xs font-mono text-slate-700">
              <li className="flex items-center gap-2">
                <Icons.Check /> Atomically Synchronized with Postgres Ledger
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check /> Zero-Overhead Redis Guardrail (&lt;0.8ms checks)
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check /> Instant Drop-in OpenAI Base URL Switch
              </li>
            </ul>
          </div>

          {/* Un-alterable Audit Ledger */}
          <div className="bg-white/60 rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-800 uppercase font-mono mb-3 tracking-wide flex items-center gap-1.5">
              <Icons.Code /> Un-alterable Audit Ledger (PostgreSQL)
            </h3>
            <div className="relative">
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-thin pb-4">
                {ledger.length === 0 ? (
                  <div className="text-xs text-slate-400 font-mono italic text-center py-6">
                    No persistent ledger entries found. Execute API completions to generate.
                  </div>
                ) : (
                  ledger.map((entry) => {
                    const isGrant = entry.type === "grant";
                    const formattedAmt = (Math.abs(entry.amount) / 1000000).toFixed(4);
                    return (
                      <div key={entry.id} className="flex justify-between items-start text-[10px] py-1.5 border-b border-slate-200/50 last:border-0 font-mono">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{entry.description}</span>
                          <span className="text-[8px] text-slate-400">{new Date(entry.createdAt).toLocaleTimeString()} // {entry.type}</span>
                        </div>
                        <span className={`font-bold ${isGrant ? "text-emerald-600" : "text-rose-600"}`}>
                          {isGrant ? "+" : "-"}${formattedAmt}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {ledger.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* Standardizer Rates Matrix */}
          <div className="bg-white/60 rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase font-mono mb-3 tracking-wide flex items-center gap-1.5">
              <Icons.Cpu /> Standardizer Multipliers Matrix
            </h3>
            <div className="flex flex-col gap-2">
              {MODELS_LIST.map((m) => (
                <div key={m.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/50 last:border-0 font-mono">
                  <span className="font-semibold text-slate-700">{m.name}</span>
                  <span className="text-indigo-600 font-bold">{(m.outputCost * 1000000).toLocaleString()} Cr / {m.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE LIVE SIMULATION PANEL */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-6">
          <div className="absolute top-0 right-0 p-2.5 bg-slate-50 border-l border-b border-slate-200 rounded-bl-xl flex items-center gap-2">
            <button
              onClick={handleInstantTopUp}
              className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded transition-all cursor-pointer mr-1"
            >
              ⚡ DEV SEED: +$100
            </button>
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase select-none hidden sm:inline">INTERACTIVE LABS</span>
          </div>

          <div className="pr-24 sm:pr-0">
            <h3 className="text-sm font-bold text-[#121118] uppercase tracking-wide flex items-center gap-1.5 font-mono">
              <Icons.Sparkles /> Play Sandbox Simulator
            </h3>
            <p className="text-xs text-slate-500 font-mono uppercase mt-1">Select a model node and fire client queries to see the dynamic wallet burn</p>
          </div>

          {/* Model Selectors */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500 block mb-2">// 1. CHOOSE SYSTEM MODEL</span>
            <div className="grid grid-cols-2 gap-3">
              {MODELS_LIST.map((m) => {
                const isSelected = selectedModel.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => !isStreaming && setSelectedModel(m)}
                    disabled={isStreaming}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between h-18 ${isSelected
                      ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/10"
                      : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
                    } ${isStreaming ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[9px] font-mono uppercase font-bold ${isSelected ? "text-indigo-600 font-extrabold" : "text-slate-500"}`}>{m.provider}</span>
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase border font-mono ${isSelected ? "text-indigo-700 border-indigo-400 bg-indigo-50" : m.color}`}>
                        ${m.outputCost.toFixed(2)} / {m.unit}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-sans mt-2 truncate text-slate-800">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authorize Compute As Selector */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500 block mb-2">// 1.5. AUTHORIZE COMPUTE AS</span>
            <select
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              disabled={isStreaming}
              className="w-full bg-[#FBFBFA] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-[#121118] focus:outline-none focus:border-indigo-600 transition-all font-mono disabled:opacity-50 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 24 24'><path d='M7 10l5 5 5-5z'/></svg>")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px'
              }}
            >
              <option value="default">Default Account (UID: {TEST_USER_ID})</option>
              {apiKeys
                .filter((k) => k.status === "active")
                .map((k) => {
                  const visiblePrefix = k.key.substring(0, 15);
                  const visibleSuffix = k.key.substring(k.key.length - 5);
                  const maskedKey = `${visiblePrefix}...${visibleSuffix}`;
                  return (
                    <option key={k.id} value={k.key}>
                      {k.name} ({maskedKey})
                    </option>
                  );
                })}
            </select>
          </div>

          {/* User Prompt Text Area */}
          <div className="relative">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500 block mb-2">// 2. DEFINE SYSTEM PROMPT PAYLOAD</span>
            <div className="relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                disabled={isStreaming}
                className="w-full bg-[#FBFBFA] border border-slate-200 rounded-2xl px-4 py-3.5 text-xs text-[#121118] placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-mono min-h-[75px] resize-none"
                placeholder="Write dynamic prompts matching your target agent variables..."
              />
              <button
                onClick={handleExecuteSandbox}
                disabled={isStreaming}
                className={`absolute bottom-3.5 right-3.5 px-4.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${isStreaming
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-50 text-white shadow"
                }`}
              >
                {isStreaming ? "PROCESSING..." : "EXECUTE PROXY"} <Icons.ArrowRight />
              </button>
            </div>
          </div>

          {/* Console & Stream output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Routing telemetry console */}
            <div className="bg-[#121118] border border-slate-800 rounded-2xl overflow-hidden h-56 flex flex-col shadow-inner">
              <div className="bg-[#1C1B23] border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between">
                <span className="text-[9px] font-mono text-indigo-400 font-bold tracking-wider">ROUTING CORE METRICS</span>
                <span className="text-[8px] font-mono text-emerald-500 tracking-wider">LIVE TELEMETRY</span>
              </div>
              <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed flex flex-col gap-2 scrollbar-thin">
                {systemLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                    <p className="text-xs">Waiting for proxy initialization...</p>
                    <p className="text-[9px] opacity-60">Click "Execute Proxy" to start live transaction logs</p>
                  </div>
                ) : (
                  systemLogs.map((log, index) => {
                    let logColor = "text-slate-400";
                    if (log.type === "redis") logColor = "text-rose-400";
                    if (log.type === "success") logColor = "text-emerald-400";
                    if (log.type === "postgres") logColor = "text-purple-400";
                    if (log.type === "gateway") logColor = "text-sky-400";

                    return (
                      <div key={index} className="pb-1.5 border-b border-slate-900/40 last:border-0">
                        <span className="text-slate-600 mr-2">[{log.time}]</span>
                        <span className={logColor}>{log.msg}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Client Stream box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden h-56 flex flex-col">
              <div className="bg-slate-100 border-b border-slate-200/80 px-3 py-1.5">
                <span className="text-[9px] font-mono text-slate-500 font-bold">CLIENT STREAM payload</span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center overflow-y-auto font-sans text-xs">
                {streamText === "" ? (
                  <div className="text-slate-400 text-center italic">No content stream. Complete inputs.</div>
                ) : selectedModel.id.includes("flux") ? (
                  <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-slate-200">
                    <div className="w-full h-24 bg-gradient-to-tr from-slate-200 to-indigo-100 flex items-center justify-center rounded-lg relative overflow-hidden animate-pulse border border-indigo-100">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider absolute">flux_node_render.png</span>
                    </div>
                  </div>
                ) : selectedModel.id.includes("labs") ? (
                  <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-slate-200">
                    <div className="w-full py-3 px-4 bg-[#FBFBFA] rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-inner">
                      <button className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs">▶</button>
                      <div className="flex-1 flex gap-0.5 items-end h-4">
                        <span className="w-1 bg-indigo-400 rounded-full h-3 animate-pulse"></span>
                        <span className="w-1 bg-indigo-600 rounded-full h-4 animate-pulse"></span>
                        <span className="w-1 bg-indigo-300 rounded-full h-2"></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-slate-700 leading-relaxed bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm flex items-start gap-1">
                    <span className="text-indigo-600 font-extrabold select-none">&gt;</span>
                    <span>{streamText}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Code snippets */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500">// 3. SWAP BASE ENDPOINTS</span>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveTab("node")}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all uppercase ${activeTab === "node" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  NODEJS
                </button>
                <button
                  onClick={() => setActiveTab("python")}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all uppercase ${activeTab === "python" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  PYTHON
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-[#121118] border border-slate-800 p-4 rounded-xl text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto scrollbar-none shadow-inner">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
              <button
                onClick={() => {
                  const temp = document.createElement("textarea");
                  temp.value = codeSnippets[activeTab];
                  document.body.appendChild(temp);
                  temp.select();
                  document.execCommand("copy");
                  document.body.removeChild(temp);
                }}
                className="absolute top-3.5 right-3.5 p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-mono transition-all"
              >
                COPY CODE
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 1: HOW IT WORKS */}
      <section id="how-it-works" className="w-full max-w-[90%] mx-auto py-16 border-t border-slate-200 relative z-20">
        <div className="flex flex-col gap-4 mb-10">
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// DYNAMIC LIFECYCLE</span>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-[#121118]">
            HOW IT WORKS: THE TRANSACTION PIPELINE
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Every token, generation, and voice segment flows through our high-performance clearinghouse routing layer.
            Here is what happens from execution to settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Proxy Ingress",
              desc: "Your agent fires a request using our base URL and universal API key, routing calls via a unified gateway.",
              badge: "HTTP / POST"
            },
            {
              step: "02",
              title: "Redis Guardrail",
              desc: "The system intercepts the call to authenticate user credits and locks balance constraints in <0.8ms.",
              badge: "ATOMIC CACHE"
            },
            {
              step: "03",
              title: "SSE Stream Forwarding",
              desc: "Payload is securely proxied to OpenAI/Anthropic/Gemini, streaming completed tokens back to your agent.",
              badge: "STREAMS / CHUNKS"
            },
            {
              step: "04",
              title: "Postgres Settlement",
              desc: "A background Node-Redis worker asynchronously reconciles token usage and commits audit logs to PostgreSQL.",
              badge: "SECURE LEDGER"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/60 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative group hover:border-indigo-600 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-3xl font-black text-slate-300 group-hover:text-indigo-600 transition-colors">{item.step}</span>
                <span className="text-[9px] font-mono font-bold bg-slate-50/50 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded uppercase">{item.badge}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#121118] uppercase tracking-wide font-mono mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1.5: AGENT API KEYS MANAGER */}
      <section id="agent-keys" className="w-full max-w-[90%] mx-auto py-16 border-t border-slate-200 relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// AGENT GATEWAY CREDENTIALS</span>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-[#121118]">
              AGENT API INTEGRATIONS
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Create and manage authentication credentials for remote software agents, pipelines, and frameworks to connect to your unified settlement core.
            </p>
          </div>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow cursor-pointer font-mono"
          >
            + CREATE NEW API KEY
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase pb-3">
                <th className="pb-3 pr-4 font-bold">// KEY NAME</th>
                <th className="pb-3 pr-4 font-bold">// SECRET API KEY</th>
                <th className="pb-3 pr-4 font-bold">// DATE CREATED</th>
                <th className="pb-3 pr-4 font-bold">// STATUS</th>
                <th className="pb-3 text-right font-bold">// ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No active agent credentials found. Generate a key above to start connecting workflows.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => {
                  const isRevoked = key.status === "revoked";
                  const visiblePrefix = key.key.substring(0, 15);
                  const visibleSuffix = key.key.substring(key.key.length - 5);
                  const maskedKey = `${visiblePrefix}...${visibleSuffix}`;
                  
                  return (
                    <tr key={key.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pr-4 font-bold text-[#121118]">{key.name}</td>
                      <td className="py-4 pr-4 text-slate-600 font-mono">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                            {maskedKey}
                          </code>
                          {!isRevoked && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(key.key);
                                alert("API Key copied to clipboard!");
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer text-[10px]"
                              title="Copy full key string"
                            >
                              [COPY]
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-500">{key.created}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isRevoked 
                          ? "bg-rose-50 border-rose-200 text-rose-700" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {isRevoked ? "revoked" : "active"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {!isRevoked ? (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to revoke keys for: ${key.name}? Remote agents will immediately lose balance authorization.`)) {
                                setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: "revoked" } : k));
                                if (selectedApiKey === key.key) {
                                  setSelectedApiKey("default");
                                }
                              }
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer text-[10px]"
                          >
                            [REVOKE ACCESS]
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">[DEACTIVATED]</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PROVIDER KEY VAULT (BYOK) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t border-slate-200/80 pt-8">
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#121118] uppercase tracking-wide font-mono flex items-center gap-1.5">
              <Icons.Wallet /> Provider API Key Vault (BYOK)
            </h3>
            <p className="text-xs text-slate-500 font-mono uppercase leading-relaxed">
              Vault your direct provider developer keys. When your software agents connect in the background, our gateway will dynamically authorize, sign, and route queries using your custom keys—running autonomously even when the dashboard is closed.
            </p>
            <div className="bg-[#121118] text-slate-400 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono leading-relaxed shadow-inner">
              <span className="text-indigo-400 font-bold block mb-1.5">// BACKGROUND CONNECTION GUIDE</span>
              To execute agent tasks in the background:
              <ol className="list-decimal pl-4 mt-1 flex flex-col gap-1 text-[10px]">
                <li>Paste and save your direct provider keys in the vault.</li>
                <li>Configure your remote agent codebase with base URL: <code className="text-[#F1EFEA] font-bold">http://localhost:5001/v1</code></li>
                <li>Pass your Universal-Cred key: <code className="text-[#F1EFEA] font-bold">ch_live_key_98765_...</code> as the bearer token.</li>
              </ol>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-5">
            
            {/* OpenAI Vault */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-slate-500">// OpenAI / ChatGPT Access Key</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono ${openaiConnected 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                  : "bg-slate-100 text-slate-400 border border-slate-200/50"}`}
                >
                  {openaiConnected ? "🟢 Vaulted" : "🔴 Offline"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={openaiConnected ? "••••••••••••••••••••••••••••••••" : "sk-proj-..."}
                  value={vaultOpenAI}
                  disabled={openaiConnected}
                  onChange={(e) => setVaultOpenAI(e.target.value)}
                  className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono disabled:opacity-50"
                />
                {openaiConnected ? (
                  <button
                    onClick={() => {
                      localStorage.removeItem("vault_openai");
                      setVaultOpenAI("");
                      setOpenaiConnected(false);
                      alert("OpenAI API key removed from vault.");
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono text-[10px] font-bold px-3 py-2.5 rounded-xl border border-rose-200/50 transition-all cursor-pointer"
                  >
                    DISCONNECT
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!vaultOpenAI.trim()) return;
                      localStorage.setItem("vault_openai", vaultOpenAI);
                      setOpenaiConnected(true);
                      alert("OpenAI key successfully vaulted locally!");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold px-3 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                  >
                    CONNECT
                  </button>
                )}
              </div>
            </div>

            {/* Anthropic Vault */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-slate-500">// Anthropic / Claude Access Key</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono ${anthropicConnected 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                  : "bg-slate-100 text-slate-400 border border-slate-200/50"}`}
                >
                  {anthropicConnected ? "🟢 Vaulted" : "🔴 Offline"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={anthropicConnected ? "••••••••••••••••••••••••••••••••" : "sk-ant-..."}
                  value={vaultAnthropic}
                  disabled={anthropicConnected}
                  onChange={(e) => setVaultAnthropic(e.target.value)}
                  className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono disabled:opacity-50"
                />
                {anthropicConnected ? (
                  <button
                    onClick={() => {
                      localStorage.removeItem("vault_anthropic");
                      setVaultAnthropic("");
                      setAnthropicConnected(false);
                      alert("Anthropic API key removed from vault.");
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono text-[10px] font-bold px-3 py-2.5 rounded-xl border border-rose-200/50 transition-all cursor-pointer"
                  >
                    DISCONNECT
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!vaultAnthropic.trim()) return;
                      localStorage.setItem("vault_anthropic", vaultAnthropic);
                      setAnthropicConnected(true);
                      alert("Anthropic key successfully vaulted locally!");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold px-3 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                  >
                    CONNECT
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: COST ESTIMATOR */}
      <section id="cost-estimator" className="w-full max-w-[90%] mx-auto py-16 border-t border-slate-200 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 flex flex-col justify-center pr-0 lg:pr-6 gap-5">
            <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// COMPUTE CALCULATOR</span>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase leading-tight text-[#121118]">
              ESTIMATE YOUR MULTI-MODEL BILLING
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Input your expected transaction volumes across text, audio, and images.
              See the exact micro-credits consumed based on our standard rate multiplier matrices.
            </p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 font-mono leading-relaxed">
              <span className="font-bold text-indigo-700 block mb-1">PRO-TIP:</span>
              Rates are atomically mapped back to provider base models with no hidden markup. You pay exactly what the compute costs.
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-[#121118] uppercase tracking-wide font-mono flex items-center gap-1.5">
              <Icons.Sparkles /> Dynamic Estimator
            </h3>

            {/* Sliders */}
            <div className="flex flex-col gap-4">
              {/* LLM Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="text-slate-500 uppercase font-bold">GPT-4o Input Tokens</span>
                  <span className="text-slate-800 font-bold">{(calcInputTokens / 1000).toFixed(0)}k Tokens</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="10000"
                  value={calcInputTokens}
                  onChange={(e) => setCalcInputTokens(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* LLM Output */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="text-slate-500 uppercase font-bold">GPT-4o Output Tokens</span>
                  <span className="text-slate-800 font-bold">{(calcOutputTokens / 1000).toFixed(0)}k Tokens</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={calcOutputTokens}
                  onChange={(e) => setCalcOutputTokens(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Flux Images */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="text-slate-500 uppercase font-bold">Flux.1 Dev Image Generations</span>
                  <span className="text-slate-800 font-bold">{calcImages} Generations</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="1"
                  value={calcImages}
                  onChange={(e) => setCalcImages(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* ElevenLabs audio */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="text-slate-500 uppercase font-bold">ElevenLabs Audio Seconds</span>
                  <span className="text-slate-800 font-bold">{calcAudio} Seconds</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3600"
                  step="10"
                  value={calcAudio}
                  onChange={(e) => setCalcAudio(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Calculations Result */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">ESTIMATED CORES</span>
                <span className="font-mono text-lg font-black text-indigo-600">
                  {((calcInputTokens * 5) + (calcOutputTokens * 15) + (calcImages * 30000) + (calcAudio * 2000)).toLocaleString()}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />
              <div className="flex flex-col items-center sm:items-start font-mono">
                <span className="text-[9px] text-slate-400 uppercase font-bold">ESTIMATED TOTAL</span>
                <span className="text-lg font-black text-slate-900">
                  ${(((calcInputTokens * 5) + (calcOutputTokens * 15) + (calcImages * 30000) + (calcAudio * 2000)) / 1000000).toFixed(4)} <span className="text-xs text-slate-400 font-bold">USD</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: ABOUT */}
      <section id="about" className="w-full max-w-[90%] mx-auto py-16 border-t border-slate-200 relative z-20">
        <div className="flex flex-col gap-4 mb-10 text-center items-center">
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// CLEARINGHOUSE STATEMENT</span>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-[#121118] max-w-2xl leading-tight">
            WHY WE BUILT THE UNIVERSAL SETTLEMENT LAYER
          </h2>
          <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
            Multi-model compute scaling demands a financial infrastructure that moves as fast as inference engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="bg-rose-50/40 border border-rose-100 rounded-3xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-rose-600 font-mono text-sm">
              [❌]
            </div>
            <h4 className="text-sm font-bold uppercase font-mono text-rose-950 tracking-wide">The Compute Dilemma</h4>
            <p className="text-xs text-rose-900/80 leading-relaxed font-mono uppercase">
              DECENTRALIZED KEY COMPLEXITY / BALANCE LOCKUPS
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              When software agents execute multi-provider workflows (OpenAI for logic, ElevenLabs for voice, Flux for images), developer teams are forced to rotation-manage 10+ secret keys, maintain minimum account deposits across multiple platforms, and build complex in-house telemetry loops just to audit aggregate consumption metrics.
            </p>
          </div>

          <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center font-bold text-emerald-600 font-mono text-sm">
              [✓]
            </div>
            <h4 className="text-sm font-bold uppercase font-mono text-emerald-950 tracking-wide">The Universal Solution</h4>
            <p className="text-xs text-emerald-900/80 leading-relaxed font-mono uppercase">
              SINGLE WALLET SETTLEMENT / ZERO overhead
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Universal-Cred aggregates this. Your client interacts with our high-speed endpoint using a single universal token. Credits are audited atomically in cache and synchronized to PostgreSQL. In-flight API queries are dynamically completed with zero key rotation fatigue or capital lockups.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ */}
      <section id="faq" className="w-full max-w-[90%] mx-auto py-16 border-t border-slate-200 relative z-20">
        <div className="flex flex-col gap-4 mb-10">
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">// COMMON QUESTIONS</span>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase text-[#121118]">
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        <div className="flex flex-col gap-3 max-w-3xl">
          {[
            {
              q: "How does Universal-Cred manage multiple provider APIs under the hood?",
              a: "Our gateway acts as an intelligent proxy. When you send requests to our base URL, the middleware intercepts the call, validates your Universal Core wallet balance in Redis, streams the provider's response, aggregates raw output counts, and charges you atomically."
            },
            {
              q: "What is the settlement latency overhead?",
              a: "Less than 0.8ms. By using atomic Redis DECR checks in the guardrail layer, we authorize compute requests instantly before forwarding them to OpenAI, Anthropic, or Gemini. The persistent PostgreSQL ledger sync is handled asynchronously off the main request thread."
            },
            {
              q: "Can I self-host this Clearinghouse platform?",
              a: "Yes. The codebase uses standard PostgreSQL and Redis configurations. By customizing the environment variables, you can run the unified server for your private development teams."
            },
            {
              q: "What happens if a stream request fails mid-way?",
              a: "The billing middleware only charges for the tokens successfully received and processed. If the SSE pipeline disconnects or aborts, we run an adjustment calculation against the ledger database."
            }
          ].map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="bg-white/60 border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center p-5 text-left font-mono font-bold text-xs uppercase tracking-wide text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <span>{item.q}</span>
                  <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="p-5 border-t border-slate-200/50 bg-[#FBFBFA]/60 text-slate-600 text-xs leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* TOP-UP MODAL */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-[#121118]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-3xl overflow-hidden p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3 font-mono">
              <Icons.Wallet />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top-up Wallet Cores</h2>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-mono uppercase">
              DEPOSIT LIQUID CREDITS INTO THE UNIFIED PERSISTENT DATABASE AND REDIS CACHE.
            </p>

            <div className="flex flex-col gap-4 mb-5">
              <div className="flex gap-2">
                {["10", "50", "100"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTopUpAmount(preset)}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${topUpAmount === preset
                      ? "bg-[#121118] text-white border-[#121118]"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    ${preset} USD
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono pr-12"
                  placeholder="Or custom amount..."
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-bold font-mono">USD</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">YOU WILL GET:</span>
                <span className="text-indigo-600 font-bold">
                  {(parseFloat(topUpAmount || "0") * 1000000).toLocaleString()} Credits
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleTopUpConfirm}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-50 text-white font-bold text-xs rounded-xl shadow transition-all font-mono"
              >
                CONFIRM FUND
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW AGENT API KEY MODAL */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-[#121118]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-3xl overflow-hidden p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowNewKeyModal(false);
                setNewlyCreatedKey(null);
                setNewKeyName("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3 font-mono">
              <Icons.Code />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Generate Agent API Key</h2>
            </div>

            {newlyCreatedKey ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-500 leading-relaxed font-mono uppercase">
                  COPY THIS SECRET KEY NOW. FOR SECURITY REASONS, IT WILL NOT BE SHOWN AGAIN.
                </p>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-inner">
                  <span className="font-mono text-xs text-slate-800 break-all select-all font-bold">{newlyCreatedKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey);
                      alert("API Key copied to clipboard!");
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-indigo-200/50 cursor-pointer"
                  >
                    COPY
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setNewlyCreatedKey(null);
                    setNewKeyName("");
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all font-mono"
                >
                  DONE
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newKeyName.trim()) return;
                  const randomSegment = Math.random().toString(36).substring(2, 10);
                  const generatedString = `ch_live_key_98765_${randomSegment}`;
                  const newEntry = {
                    id: Date.now(),
                    name: newKeyName,
                    key: generatedString,
                    created: new Date().toISOString().split("T")[0] || "2026-06-12",
                    status: "active"
                  };
                  setApiKeys(prev => [newEntry, ...prev]);
                  setNewlyCreatedKey(generatedString);
                }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs text-slate-500 mb-4 leading-relaxed font-mono uppercase">
                  ENTER A FRIENDLY LABEL TO IDENTIFY THIS KEY LOG IN YOUR SETTLEMENT PORTAL.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. LangChain Agent Router..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="flex-grow py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all font-mono"
                  >
                    GENERATE
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/60 pt-16 pb-8 relative z-20">
        <div className="w-full max-w-[90%] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Logo & Description */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <a href="#hero" className="flex items-center gap-3 hover:opacity-85 transition-opacity w-fit">
              <div className="w-8 h-8 rounded bg-[#121118] text-[#F1EFEA] flex items-center justify-center font-bold font-mono tracking-tighter shadow">
                 U    
              </div>
              <span className="font-mono font-black tracking-widest text-sm text-[#121118]">UNIVERSAL-CRED</span>
            </a>
            <p className="text-xs text-slate-500 font-mono uppercase leading-relaxed max-w-sm">
              THE UNIFIED SETTLEMENT LAYER FOR AGENT COMPUTING. ROUTE AND AUDIT COMPUTE WITH SUB-MILLISECOND SETTLEMENT GUARANTEES.
            </p>
            <div className="flex items-center gap-2 mt-2 font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">// PRODUCT</h5>
            <ul className="flex flex-col gap-2 text-xs font-semibold text-slate-600 font-mono">
              <li><a href="#playground" className="hover:text-indigo-600 transition-colors">SANDBOX</a></li>
              <li><a href="#how-it-works" className="hover:text-indigo-600 transition-colors">ARCHITECTURE</a></li>
              <li><a href="#cost-estimator" className="hover:text-indigo-600 transition-colors">ESTIMATOR</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">// DEVELOPERS</h5>
            <ul className="flex flex-col gap-2 text-xs font-semibold text-slate-600 font-mono">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">GITHUB API</a></li>
              <li><a href="#playground" className="hover:text-indigo-600 transition-colors">API REFS</a></li>
              <li><a href="#playground" className="hover:text-indigo-600 transition-colors">STATUS MONITOR</a></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">// NEWSLETTER</h5>
            <p className="text-xs text-slate-500 font-mono uppercase leading-relaxed">
              SUBSCRIBE TO RECEIVE AGENTIC COMPUTATION INFRASTRUCTURE UPDATES.
            </p>
            {newsletterSubscribed ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-mono font-bold">
                ✓ YOU ARE NOW IN THE LOOP.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setNewsletterSubscribed(true);
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="dev@clearinghouse.io"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-all shadow cursor-pointer"
                >
                  JOIN
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="w-full max-w-[90%] mx-auto pt-8 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-mono tracking-wider uppercase">
          <span>© 2026 CLEARINGHOUSE LABS INC.</span>
          <span>⚡ DESIGNED FOR MULTI-PROVIDER AGENT ORCHESTRATORS</span>
        </div>
      </footer>

    </div>
  );
}