import { useState } from "react";
import { ArrowUpRight, LayoutGrid, LogOut, Menu, Sparkles, User, X } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";
import { useAuthStore } from "../../store/authStore";

export function WebHeader() {
  const { currentRoute, setRoute, setAuthViewMode } = useRouteStore();
  const { token, email, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Overview" },
    { id: "features", label: "Features" },
    { id: "download", label: "Download" },
    { id: "faq", label: "FAQ" },
  ] as const;

  const navigate = (route: "landing" | "features" | "download" | "faq" | "auth" | "dashboard") => {
    setRoute(route);
    setMobileOpen(false);
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthViewMode(mode);
    navigate("auth");
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" onClick={() => navigate("landing")} className="site-brand" aria-label="Widget Studio home">
          <img src="/widget-studio-logo.png" alt="" className="site-brand-mark" />
          <span className="site-brand-copy">
            <strong>Widget Studio</strong>
            <small>your desktop, composed</small>
          </span>
        </button>

        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => navigate(item.id)}
              className={"site-nav-link " + (currentRoute === item.id ? "is-active" : "")}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="site-header-actions">
          {token ? (
            <>
              <button type="button" className="site-button site-button-secondary site-button-compact" onClick={() => navigate("dashboard")}>
                <LayoutGrid size={15} />
                Open canvas
              </button>
              <div className="site-account" title={email ?? undefined}>
                <User size={14} />
                <span>{email}</span>
              </div>
              <button type="button" className="site-icon-button" onClick={logout} aria-label="Sign out" title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <button type="button" className="site-text-button" onClick={() => openAuth("login")}>Sign in</button>
              <button type="button" className="site-button site-button-primary site-button-compact" onClick={() => openAuth("signup")}>
                Start building
                <ArrowUpRight size={15} />
              </button>
            </>
          )}
        </div>

        <button type="button" className="site-menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="site-mobile-menu">
          <nav aria-label="Mobile navigation">
            {navItems.map((item) => (
              <button type="button" key={item.id} onClick={() => navigate(item.id)} className={"site-mobile-link " + (currentRoute === item.id ? "is-active" : "")}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="site-mobile-actions">
            {token ? (
              <>
                <button type="button" className="site-button site-button-primary" onClick={() => navigate("dashboard")}><LayoutGrid size={15} /> Open canvas</button>
                <button type="button" className="site-button site-button-secondary" onClick={logout}><LogOut size={15} /> Sign out</button>
              </>
            ) : (
              <>
                <button type="button" className="site-button site-button-secondary" onClick={() => openAuth("login")}>Sign in</button>
                <button type="button" className="site-button site-button-primary" onClick={() => openAuth("signup")}><Sparkles size={15} /> Start building</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
