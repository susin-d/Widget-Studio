import { ArrowUpRight, Github, Heart } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

export function WebFooter() {
  const { setRoute, setAuthViewMode } = useRouteStore();
  const go = (route: "landing" | "features" | "download" | "faq") => setRoute(route);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-lead">
          <button type="button" onClick={() => go("landing")} className="site-brand site-brand-footer" aria-label="Widget Studio home">
            <img src="/widget-studio-logo.png" alt="" className="site-brand-mark" />
            <span className="site-brand-copy"><strong>Widget Studio</strong><small>your desktop, composed</small></span>
          </button>
          <p>A small, thoughtful layer for the screen you already spend your day in.</p>
        </div>
        <div className="site-footer-column">
          <span className="site-footer-label">Product</span>
          <button type="button" onClick={() => go("features")}>Features</button>
          <button type="button" onClick={() => go("download")}>Download</button>
          <button type="button" onClick={() => { setAuthViewMode("signup"); setRoute("auth"); }}>Create an account</button>
        </div>
        <div className="site-footer-column">
          <span className="site-footer-label">Explore</span>
          <button type="button" onClick={() => go("faq")}>FAQ & support</button>
          <button type="button" onClick={() => setRoute("dashboard")}>Open web canvas</button>
          <a href="https://github.com" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
        </div>
        <div className="site-footer-card">
          <span className="site-footer-label">Made for the everyday</span>
          <strong>Windows 10 / 11</strong>
          <span>Native overlays · cloud sync · no noise</span>
          <button type="button" onClick={() => go("download")} className="site-footer-card-link">Get the client <ArrowUpRight size={14} /></button>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Widget Studio</span>
        <span className="site-footer-made">Made with <Heart size={12} /> for focused work.</span>
      </div>
    </footer>
  );
}
