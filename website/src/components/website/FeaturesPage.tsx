import { Sparkles, Cpu, Lock, Shield, Layers, HelpCircle, ArrowRight } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

export function FeaturesPage() {
  const { setRoute } = useRouteStore();

  const widgetsList = [
    { name: "Clock & World Clock", desc: "Local time and multi-timezone trackers with customizable timezone listings." },
    { name: "System Monitor", desc: "Real-time updates of CPU and RAM memory usage percentages with near-zero memory footprint." },
    { name: "Focus Timer (Pomodoro)", desc: "Build workspace habits. Includes customizable intervals, active loops, and status states." },
    { name: "Mindmap Widget", desc: "Organize brainstorming nodes. Interactive drag nodes and customizable tree hierarchies." },
    { name: "Sticky Notepad", desc: "Scribble reminders instantly. Multi-colored grid cells and autosave state backups." },
    { name: "Weather Widget", desc: "Forecast API lookups. Display local temperature and weather report overlays." },
    { name: "Calculator", desc: "Evaluate formulas directly from the desktop canvas with history panels." },
    { name: "Todo & Calendar", desc: "Interactive task checkboxes, task filtering, and a standard calendar grid checker." },
  ];

  return (
    <div className="bg-[#090a0f] text-white min-h-screen py-16 px-6 relative">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Explore the{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Features
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            13+ built-in widgets, robust custom styles, and deep system integrations engineered to work flawlessly.
          </p>
        </div>

        {/* Technical Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4 shadow-xl">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu size={20} />
            </div>
            <h3 className="font-bold text-lg">Rust-Powered Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tauri uses the native webview of the OS. The desktop client runs with negligible overhead, using less than 15MB RAM idle.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4 shadow-xl">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock size={20} />
            </div>
            <h3 className="font-bold text-lg">PostgreSQL Cloud Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every coordinate shift, style change, and todo checkbox is securely pushed to our backend database and synced automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4 shadow-xl">
            <div className="h-10 w-10 rounded-lg bg-[#ff4f87]/10 border border-[#ff4f87]/30 flex items-center justify-center text-[#ff4f87]">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-lg">Sandboxed Sandbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create custom HTML/CSS/JS widgets safely. Sensitive APIs like clipboard and notifications prompt you for approval first.
            </p>
          </div>
        </div>

        {/* Built-in Widgets Showcase */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Built-in Desktop Widgets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgetsList.map((w) => (
              <div key={w.name} className="rounded-xl border border-white/5 bg-white/[0.01] p-5 hover:bg-white/[0.03] transition-all duration-200">
                <h4 className="font-semibold text-slate-200 text-sm mb-1.5">{w.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 text-center max-w-3xl mx-auto space-y-4">
          <Sparkles className="mx-auto text-indigo-400" size={32} />
          <h3 className="text-xl font-bold">Ready to design your desktop?</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Get started with our browser workspace layout canvas preview or install the desktop application.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setRoute("dashboard")}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition"
            >
              Open Web Canvas
            </button>
            <button
              onClick={() => setRoute("download")}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 px-5 py-2.5 text-xs font-semibold border border-white/10 transition"
            >
              Download App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
