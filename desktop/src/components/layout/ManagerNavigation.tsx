import { Bell, Blocks, Cloud, Code2, Gauge, LayoutDashboard, Boxes, Bot, Palette, Search, Settings, ShieldCheck, Store } from "lucide-react";
import type { ReactNode } from "react";

export type ManagerView = "dashboard" | "widgets" | "marketplace" | "layouts" | "themes" | "automations" | "agents" | "performance" | "permissions" | "sync" | "notifications" | "developer" | "settings";

const primary: Array<{ id: ManagerView; label: string; icon: ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "widgets", label: "Widgets", icon: <Boxes size={16} /> },
  { id: "marketplace", label: "Import & export", icon: <Store size={16} /> },
  { id: "layouts", label: "Desktop layouts", icon: <Blocks size={16} /> },
  { id: "themes", label: "Theme studio", icon: <Palette size={16} /> },
  { id: "automations", label: "Automations", icon: <Bot size={16} /> },
  { id: "agents", label: "AI Agents", icon: <Bot size={16} /> },
  { id: "performance", label: "Performance", icon: <Gauge size={16} /> },
];

const secondary: Array<{ id: ManagerView; label: string; icon: ReactNode }> = [
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "sync", label: "Backup & sync", icon: <Cloud size={16} /> },
  { id: "permissions", label: "Permissions", icon: <ShieldCheck size={16} /> },
  { id: "developer", label: "Dev tools", icon: <Code2 size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export const managerNavigationItems = [...primary, ...secondary];

export function ManagerNavigation({ view, onView, onSearch }: { view: ManagerView; onView: (view: ManagerView) => void; onSearch: () => void }) {
  return (
    <aside className="manager-nav studio-panel flex w-52 shrink-0 flex-col">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onSearch}
          aria-label="Search workspace"
          className="flex w-full items-center gap-2 rounded-lg border border-black/8 dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.06] px-3 py-2 text-xs text-muted transition-all hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover-lift"
        >
          <Search size={13} />
          <span>Search workspace</span>
          <kbd className="ml-auto rounded bg-black/6 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </button>
      </div>

      {/* Workspace nav */}
      <div className="px-2 pb-1">
        <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted">Workspace</div>
        <div className="space-y-0.5">
          {primary.map(item => (
            <button key={item.id} onClick={() => onView(item.id)} className={`nav-item transition-all ${view === item.id ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* System nav — compact */}
      <div className="border-t border-black/8 px-2 py-2 dark:border-white/8">
        <div className="space-y-0.5">
          {secondary.map(item => (
            <button key={item.id} onClick={() => onView(item.id)} className={`nav-item transition-all ${view === item.id ? "active" : ""}`}>
              <div className="relative flex items-center">
                {item.icon}
                {item.id === "notifications" && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
