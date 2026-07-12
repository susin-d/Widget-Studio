import { useState } from "react";
import { Cloud, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useRouteStore } from "../../store/routeStore";

export function AuthPage() {
  const { authViewMode, setAuthViewMode, setRoute } = useRouteStore();
  const { loading, error, login, signup } = useAuthStore();

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailInput || !passwordInput) {
      setErrorMessage("Please fill in all credentials.");
      return;
    }

    try {
      if (authViewMode === "signup") {
        await signup(emailInput, passwordInput);
        setSuccessMessage("Account created successfully! Loading your canvas...");
      } else {
        await login(emailInput, passwordInput);
        setSuccessMessage("Welcome back! Loading your canvas...");
      }

      // Redirect to Web Dashboard after authentication succeeds
      setTimeout(() => {
        setRoute("dashboard");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate. Please check connection.");
    }
  };

  const perks = [
    { title: "Universal Sync", desc: "Instantly restore note lists, pomodoro targets, and task checklists." },
    { title: "No Layout Loss", desc: "Keeps coordinates preserved in a secure cloud layout database." },
    { title: "Cross-Device Canvas", desc: "Login on another PC to see your custom widgets styled exactly the same." }
  ];

  return (
    <div className="bg-[#090a0f] min-h-[calc(100vh-70px)] text-white flex flex-col md:flex-row">
      {/* Left Visual Pane */}
      <div className="flex-1 bg-gradient-to-br from-[#121424] via-[#0d0e1b] to-[#080811] p-10 md:p-16 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#6366f1,transparent_45%)] opacity-10 pointer-events-none" />
        
        {/* Brand branding */}
        <div className="flex items-center gap-2.5 z-10">
          <img src="/widget-studio-logo.png" alt="Widget Studio" className="h-7 w-7 rounded-md" />
          <span className="font-semibold text-white tracking-wider text-sm">WIDGET STUDIO CLOUD</span>
        </div>

        {/* Benefits list */}
        <div className="my-auto py-12 space-y-8 z-10 max-w-md">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Take your desktop canvas{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-[#ff4f87] bg-clip-text text-transparent">
              everywhere.
            </span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            By connecting to Widget Studio sync servers, your customized workspaces are safely preserved in the cloud database.
          </p>

          <div className="space-y-6">
            {perks.map((p) => (
              <div key={p.title} className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Check size={11} />
                </span>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">{p.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-600 z-10">
          Uses end-to-end HTTPS synchronization algorithms.
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#090a0f] relative">
        {/* Backdrop decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#ff4f87]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="text-center space-y-2 mb-6">
            <Cloud size={32} className="mx-auto text-indigo-400 animate-pulse" />
            <h3 className="text-xl font-bold">
              {authViewMode === "signup" ? "Create an Account" : "Welcome Back"}
            </h3>
            <p className="text-slate-400 text-xs">
              {authViewMode === "signup" ? "Sign up to backup widgets" : "Sign in to synchronize workspace"}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            {errorMessage && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                <Sparkles size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white py-2.5 text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all hover:translate-y-[-1px]"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Connecting...
                </>
              ) : authViewMode === "signup" ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setAuthViewMode(authViewMode === "signup" ? "login" : "signup");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition"
            >
              {authViewMode === "signup" ? "Already have an account? Sign In" : "Need a sync account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
