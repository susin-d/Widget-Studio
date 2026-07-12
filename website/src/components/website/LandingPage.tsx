import { useState, useEffect } from "react";
import { Sparkles, Download, LayoutGrid, Clock, Clipboard, Flame, HelpCircle, Check, ArrowRight } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

export function LandingPage() {
  const { setRoute, setAuthViewMode } = useRouteStore();

  // Mini Notepad state
  const [note, setNote] = useState("✨ Welcome to Widget Studio! You can edit this sticky note directly on the landing page.");
  
  // Pomodoro state
  const [seconds, setSeconds] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const mode = "focus";

  useEffect(() => {
    let interval: any = null;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Clock state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#090a0f] text-white min-h-screen overflow-x-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-30 select-none">
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-600 blur-[130px]" />
        <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-[#ff4f87] blur-[150px]" />
      </div>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto pt-20 pb-16 px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300 font-medium">
          <Sparkles size={12} className="animate-pulse" />
          Introducing Widget Studio v1.0.0 for Windows
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Your Desktop Workspace,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-[#ff4f87] bg-clip-text text-transparent">
            Reimagined
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
          Create, customize, and overlay interactive acrylic glass widgets on your Windows 11 desktop. Sync layouts across devices in real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setRoute("download")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 text-sm font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-500/20 transition-all hover:translate-y-[-1px]"
          >
            <Download size={16} />
            Download Installer
          </button>
          <button
            onClick={() => setRoute("dashboard")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 px-8 py-3.5 text-sm font-semibold border border-white/10 transition-all"
          >
            <LayoutGrid size={16} />
            Launch Web Dashboard
          </button>
        </div>
      </section>

      {/* Interactive Sandbox Showcase */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Interactive Sandbox</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Test some of our most popular widgets live right here on the webpage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Clock Widget */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col justify-between shadow-2xl min-h-[200px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-400" />
                Live Clock
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="py-6 text-center">
              <div className="text-3xl md:text-4xl font-bold tracking-widest font-mono text-slate-100">
                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-medium">
                {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-center">Standard local timezone synced</div>
          </div>

          {/* Sticky Notepad Widget */}
          <div className="rounded-2xl border border-white/10 bg-amber-500/10 backdrop-blur-xl p-5 flex flex-col justify-between shadow-2xl min-h-[200px] border-amber-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Clipboard size={13} />
                Sticky Note
              </span>
              <span className="text-[9px] font-semibold text-amber-500/80">Editable</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full flex-1 bg-transparent text-amber-100/90 text-xs py-3 outline-none resize-none placeholder-amber-200/50"
            />
            <div className="text-[10px] text-amber-400/60 text-center">Changes save temporarily</div>
          </div>

          {/* Focus Timer Widget */}
          <div className="rounded-2xl border border-white/10 bg-rose-500/10 backdrop-blur-xl p-5 flex flex-col justify-between shadow-2xl min-h-[200px] border-rose-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <Flame size={13} />
                Focus Timer
              </span>
              <span className="text-[9px] font-semibold text-rose-400">{mode.toUpperCase()}</span>
            </div>
            <div className="py-4 text-center">
              <div className="text-3xl md:text-4xl font-bold font-mono text-rose-100">{formatTime(seconds)}</div>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={toggleTimer}
                  className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 px-3 py-1 text-xs font-medium transition"
                >
                  {isRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={resetTimer}
                  className="rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1 text-xs font-medium transition"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="text-[10px] text-rose-400/60 text-center">Pomodoro method built-in</div>
          </div>
        </div>
      </section>

      {/* Feature Grid Banner */}
      <section className="max-w-6xl mx-auto py-16 px-6 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h3 className="text-3xl font-extrabold">Crafted for Windows Desktop Integration</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Widget Studio uses Rust-powered Tauri to overlay widgets with near-zero memory footprint. Snap coordinates to a grid, configure automations like Battery Saver mode, or write custom sandboxed JavaScript widgets!
            </p>
            <ul className="space-y-3.5">
              {[
                "13+ built-in widgets (Notes, Weather, Calendar, Todo, System)",
                "Full acrylic blur, custom opacity, and border radius dials",
                "Cloud backup and real-time syncing via PostgreSQL backend",
                "Dev tools to create and sandbox custom HTML widgets"
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setRoute("features")}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-semibold pt-2"
            >
              See all features
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-[#ff4f87]/5 pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">layout_sync.json</span>
              </div>
              <pre className="text-[11px] font-mono text-indigo-300 bg-black/40 rounded-xl p-4 overflow-x-auto leading-relaxed border border-white/5">
{`{
  "user_id": "83fb4b3e-e612-4cf0-8cfd-b2a65dcfd2f0",
  "settings": {
    "theme": "dark",
    "colorTheme": "berry-pop",
    "cornerRadius": 18
  },
  "widgets": [
    { "type": "clock", "rect": { "x": 32, "y": 96 } },
    { "type": "todo", "data": { "items": [] } }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
