import { Heart } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

export function WebFooter() {
  const { setRoute } = useRouteStore();

  return (
    <footer className="w-full bg-[#07080d] border-t border-white/5 py-12 px-8 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img src="/widget-studio-logo.png" alt="Widget Studio" className="h-6 w-6 rounded-md" />
            <span className="font-semibold text-white tracking-wider text-sm">WIDGET STUDIO</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Beautiful glassmorphic widgets for your Windows desktop. Create, customize, and sync layouts instantly.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-bold tracking-wider mb-3">PRODUCT</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => setRoute("landing")} className="hover:text-white transition">Home</button>
            </li>
            <li>
              <button onClick={() => setRoute("features")} className="hover:text-white transition">Features</button>
            </li>
            <li>
              <button onClick={() => setRoute("download")} className="hover:text-white transition">Downloads</button>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold tracking-wider mb-3">RESOURCES</h4>
          <ul className="space-y-2">
            <li>
              <button onClick={() => setRoute("faq")} className="hover:text-white transition">FAQ & Support</button>
            </li>
            <li>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub Repo</a>
            </li>
            <li>
              <button onClick={() => setRoute("dashboard")} className="hover:text-white transition">Web Canvas</button>
            </li>
          </ul>
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <h4 className="text-white font-bold tracking-wider mb-1">SYSTEM BADGE</h4>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 w-max">
            <span className="text-lg">🪟</span>
            <div>
              <b className="text-white block text-[11px]">Windows 11</b>
              <span className="text-[9px] text-slate-500">Fully Compatible</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-600">Built using Tauri, Vite, and Rust.</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-slate-600">
        <div>&copy; {new Date().getFullYear()} Widget Studio. All rights reserved.</div>
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
          <span>Made with</span>
          <Heart size={10} className="text-indigo-500 fill-indigo-500" />
          <span>for desktop productivity.</span>
        </div>
      </div>
    </footer>
  );
}
