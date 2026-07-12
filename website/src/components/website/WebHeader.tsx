import { useState } from "react";
import { Menu, X, LogOut, LayoutGrid, Download, HelpCircle, Sparkles, LogIn, User } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";
import { useAuthStore } from "../../store/authStore";

export function WebHeader() {
  const { currentRoute, setRoute, setAuthViewMode } = useRouteStore();
  const { token, email, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Home", icon: null },
    { id: "features", label: "Features", icon: <Sparkles size={14} /> },
    { id: "faq", label: "FAQ", icon: <HelpCircle size={14} /> },
    { id: "download", label: "Download Client", icon: <Download size={14} /> },
  ] as const;

  const navigate = (route: any) => {
    setRoute(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0c0d14]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between text-white">
      {/* Brand logo */}
      <button onClick={() => navigate("landing")} className="flex items-center gap-2.5 focus:outline-none">
        <img src="/widget-studio-logo.png" alt="Widget Studio" className="h-8 w-8 rounded-lg shadow-win" />
        <span className="font-semibold tracking-wide text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
          Widget Studio
        </span>
      </button>

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`hover:text-white transition-colors duration-200 flex items-center gap-1.5 py-1 ${
              currentRoute === item.id ? "text-indigo-400 font-semibold border-b border-indigo-400" : ""
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="hidden md:flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("dashboard")}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 px-3.5 py-2 text-xs font-semibold border border-indigo-500/30 transition-all"
            >
              <LayoutGrid size={14} />
              Web Canvas
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs">
              <User size={13} className="text-indigo-400" />
              <span className="text-slate-200 max-w-[120px] truncate">{email}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-xs font-semibold py-2 px-2"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAuthViewMode("login");
                navigate("auth");
              }}
              className="text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthViewMode("signup");
                navigate("auth");
              }}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-500/20 transition-all hover:translate-y-[-1px]"
            >
              <LogIn size={13} />
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-300 hover:text-white">
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="absolute top-[69px] left-0 right-0 z-40 bg-[#0c0d14]/95 border-b border-white/10 flex flex-col p-6 gap-4 md:hidden shadow-2xl backdrop-blur-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`text-left text-base py-1.5 flex items-center gap-2 border-l-2 pl-3 ${
                currentRoute === item.id ? "text-indigo-400 border-indigo-400 font-semibold" : "text-slate-300 border-transparent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <hr className="border-white/10 my-2" />

          {token ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 pl-3">Signed in as: <b className="text-white">{email}</b></div>
              <button
                onClick={() => navigate("dashboard")}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold"
              >
                <LayoutGrid size={16} />
                Web Canvas
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 py-2 text-sm font-semibold"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setAuthViewMode("login");
                  navigate("auth");
                }}
                className="w-full text-center text-slate-300 border border-white/10 py-2.5 rounded-lg text-sm font-semibold"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthViewMode("signup");
                  navigate("auth");
                }}
                className="w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
