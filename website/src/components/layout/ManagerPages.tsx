import { ArrowUpRight, Check, Cloud, Cpu, Download, HardDrive, Heart, LayoutGrid, MemoryStick, MoreHorizontal, Plus, RotateCw, ShieldCheck, Star, WandSparkles, Zap, Chrome, Lock, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ManagerView } from "./ManagerNavigation";
import type { DesktopWidget, WidgetKind } from "../../types/widget";
import { useManagerStore } from "../../store/managerStore";
import { nativeApi, type SystemInfo } from "../../lib/tauri";
import { useAuthStore, BACKEND_URL } from "../../store/authStore";
import { savePersistedState } from "../../lib/storage";
import { WidgetBuilder } from "../developer/WidgetBuilder";
import { CUSTOM_WIDGET_PERMISSIONS, normalizeCustomWidgetData, type CustomWidgetPermission } from "../../types/customWidget";

const permissionInfo: Record<CustomWidgetPermission, { label: string; description: string }> = {
  network: { label: "Network access", description: "Connect to HTTPS APIs and external services." },
  clipboard: { label: "Clipboard", description: "Copy text to the system clipboard." },
  notifications: { label: "Notifications", description: "Send desktop notifications." },
  openExternal: { label: "Open external links", description: "Open approved HTTP(S) links in your browser." }
};



function SyncPage({ widgets, settings, onSetWidgets }: { widgets: DesktopWidget[]; settings: any; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const { token, email, loading, error, syncStatus, lastSyncedAt, login, signup, logout } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formEmail || !formPassword) {
      setFormError("Please fill in all fields.");
      return;
    }
    try {
      if (isSignUp) {
        await signup(formEmail, formPassword);
        setSuccessMsg("Account created and synced!");
      } else {
        await login(formEmail, formPassword);
        setSuccessMsg("Logged in and synced!");
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "Authentication failed.");
    }
  };

  const handleGoogleLogin = async () => {
    const url = `${BACKEND_URL}/api/auth/google?client=web`;
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch (err) {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  };

  const handleSyncNow = async () => {
    setFormError("");
    try {
      const state = { version: 2, widgets, settings };
      const synced = await savePersistedState(state);
      if (!synced) {
        setFormError("Cloud sync failed. Check the sync status and try again.");
        return;
      }
      setSuccessMsg("Synchronized with cloud!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError("Failed to trigger manual sync.");
    }
  };

  if (token) {
    return (
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        <Panel title="Cloud Sync Active">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <Cloud size={24} className="animate-pulse" />
              <div>
                <b className="block text-sm">Account Connected</b>
                <span className="text-xs opacity-80">{email}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-muted">Sync Status</span>
                <span className={`font-semibold ${
                  syncStatus === "synced" ? "text-emerald-500" :
                  syncStatus === "syncing" ? "text-amber-500 animate-spin" :
                  syncStatus === "offline" ? "text-blue-500" : "text-red-500"
                }`}>
                  {syncStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-muted">Last Cloud Sync</span>
                <span className="font-semibold">{lastSyncedAt || "Not synced yet"}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSyncNow} className="primary-action text-xs flex items-center gap-1.5">
                <RefreshCw size={13} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                Sync Now
              </button>
              <button onClick={logout} className="flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-2 text-xs font-semibold hover:bg-red-500/20">
                <LogOut size={13} className="mr-1.5" />
                Sign Out
              </button>
            </div>
            {successMsg && <p className="text-xs font-semibold text-emerald-500">{successMsg}</p>}
            {formError && <p className="text-xs font-semibold text-red-500">{formError}</p>}
          </div>
        </Panel>

        <Panel title="Sync Information">
          <p className="text-xs text-muted leading-relaxed">
            Your widget layout, coordinates, styles, and custom data (notes, links, tasks) are securely backed up in the cloud. Changes made on this machine are synced automatically. Log into another device using the same account to instantly restore your layout.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-w-3xl">
      <Panel title={isSignUp ? "Create a Cloud Account" : "Sign In to Sync Layout"}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-muted mb-1">Email Address</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Password</label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {(formError || error) && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {formError || error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button type="submit" disabled={loading} className="primary-action w-full justify-center text-xs py-2">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
            
            <div className="flex items-center my-1.5">
              <hr className="flex-1 border-black/5 dark:border-white/5" />
              <span className="px-2 text-[10px] text-muted uppercase tracking-wider">or</span>
              <hr className="flex-1 border-black/5 dark:border-white/5" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3 py-2 text-xs font-semibold hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
            >
              <Chrome size={14} className="text-red-500" />
              Continue with Google
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormError("");
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Why cloud backup?">
        <div className="space-y-3.5 text-xs text-muted leading-relaxed">
          <p>
            <b>💻 Sync Across Devices</b><br />
            Synchronize your clock, notes, systems and configurations across multiple machines instantly.
          </p>
          <p>
            <b>🛡️ Prevent Data Loss</b><br />
            Keep your settings safe. Even if your operating system or local disk fails, your canvas remains fully recoverable.
          </p>
          <p>
            <b>⚡ Real-time Saving</b><br />
            Any changes you make to sizing, layout and positions are pushed instantly to a secure PostgreSQL database.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Dashboard({ widgets, onOpenWidgets, onSetWidgets }: { widgets: DesktopWidget[]; onOpenWidgets: () => void; onSetWidgets?: (widgets: DesktopWidget[]) => void }) {
  const { backup, restoreBackup, lastBackup, notices } = useManagerStore();
  const { token, syncStatus, lastSyncedAt } = useAuthStore();
  const [sysCpu, setSysCpu] = useState<number | null>(null);
  const [sysRam, setSysRam] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = () => {
      nativeApi.getSystemInfo()
        .then((info) => {
          setSysCpu(Math.round(info.cpu_usage));
          setSysRam(Math.round((info.ram_used / Math.max(info.ram_total, 1)) * 100));
        })
        .catch(() => {
          setSysCpu(null);
          setSysRam(null);
        });
    };
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, []);

  const handleBackup = () => {
    backup(widgets);
  };

  const handleRestore = () => {
    const restored = restoreBackup();
    if (restored && onSetWidgets) {
      onSetWidgets(restored);
    }
  };

  const stats = [
    ["Running widgets", String(widgets.length), <LayoutGrid size={18} />],
    ["Pinned widgets", String(widgets.filter(w => w.pinned).length), <Star size={18} />],
    ["System CPU Usage", sysCpu !== null ? `${sysCpu}%` : "Low", <Cpu size={18} />],
    ["System RAM Usage", sysRam !== null ? `${sysRam}%` : `${Math.max(42, widgets.length * 12)} MB`, <MemoryStick size={18} />]
  ] as const;

  const displayNotices = notices.slice(0, 4).map(n => n.message);
  const activityList = displayNotices.length > 0 ? displayNotices : ["Weather refreshed", "Clock updated", "Desktop layout saved", "Backup completed"];

  return <Page title="Today’s desktop" subtitle="Everything is running smoothly across your workspace." action={<button className="primary-action" onClick={onOpenWidgets}><Plus size={15} /> New widget</button>}>
    <div className="grid grid-cols-4 gap-3">{stats.map(([label, value, icon]) => <div className="metric-card" key={label}><div className="metric-icon">{icon}</div><div className="mt-5 text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted">{label}</div></div>)}</div>
    <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
      <Panel title="Recently edited" action="View all"><div className="grid grid-cols-3 gap-3">{widgets.slice(0,3).map((w,i) => <button key={w.id} onClick={onOpenWidgets} className="recent-card"><div className={`preview-orb orb-${i}`} /><div className="mt-3 flex items-center"><div><div className="text-sm font-semibold">{w.name}</div><div className="text-[11px] text-muted">Edited recently</div></div><MoreHorizontal size={15} className="ml-auto text-muted" /></div></button>)}</div></Panel>
      <Panel title="Recent activity"><div className="space-y-3">{activityList.map((x,i)=><div key={x} className="flex items-center gap-3 text-sm"><span className="activity-check"><Check size={11}/></span><span>{x}</span><span className="ml-auto text-[11px] text-muted">{i+2}m</span></div>)}</div></Panel>
    </div>
     <div className="mt-4 grid grid-cols-3 gap-4">
      <Panel title="Quick actions">
        <div className="grid grid-cols-2 gap-2">
          <Quick label="Backup now" icon={<Cloud/>} onClick={handleBackup}/>
          <Quick label="Restore" icon={<RotateCw/>} onClick={handleRestore}/>
          <Quick label="Open widgets" icon={<ArrowUpRight/>} onClick={onOpenWidgets}/>
          <Quick label="Import layout" icon={<Download/>} onClick={() => alert("Navigate to Desktop Layouts to import/export presets.")}/>
        </div>
      </Panel>
       <Panel title="Sync status"><div className="sync-hero"><Cloud size={30}/><div><b>{!token ? "Local only" : syncStatus === "synced" ? "All changes synced" : `Cloud sync ${syncStatus}`}</b><p>{!token ? "Sign in to sync" : lastSyncedAt ? `Last sync ${lastSyncedAt}` : "Cloud account connected"}</p></div></div></Panel>
      <Panel title="Last backup"><div className="sync-hero"><HardDrive size={30}/><div><b>{lastBackup ? new Date(lastBackup).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "No backups"}</b><p>{lastBackup ? new Date(lastBackup).toLocaleDateString() : "Save preset to protect state"}</p></div></div></Panel>
    </div>
  </Page>;
}

function ImportExport({widgets,onSetWidgets}:{widgets:DesktopWidget[];onSetWidgets:(widgets:DesktopWidget[])=>void}) {
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);
  const exportAll=()=>downloadJson("widget-studio-widgets.json",{version:2,widgets});
  
  const validateWidget = (w: any): w is DesktopWidget => {
    if (!w || typeof w !== "object") return false;
    if (typeof w.name !== "string" || !w.name) return false;
    const kinds: WidgetKind[] = ["clock", "weather", "todo", "notes", "system", "links", "calendar", "custom", "mindmap", "pomodoro", "worldclock", "stickynotes", "calculator", "chatbot"];
    if (!kinds.includes(w.type)) return false;
    if (!w.rect || typeof w.rect !== "object") return false;
    const { x, y, width, height } = w.rect;
    if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number" || typeof height !== "number") return false;
    if (!w.settings || typeof w.settings !== "object") return false;
    if (w.type === "custom" && w.data?.source) {
      const source = w.data.source;
      if (typeof source !== "object" || typeof source.html !== "string" || typeof source.css !== "string" || typeof source.js !== "string") return false;
    }
    return true;
  };

  const importFile=async(file?:File)=>{if(!file)return;try{const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:parsed.widgets;if(!Array.isArray(incoming))throw new Error("Missing widgets array");
    const validated = incoming.filter(validateWidget);
    if (validated.length === 0) {
      throw new Error("No valid widgets found in the selected JSON file.");
    }
    onSetWidgets([...widgets,...validated.map((w:DesktopWidget)=>({...w,id:crypto.randomUUID(),rect:{...w.rect}}))]);
    setIsError(false);
    setMessage(`Successfully imported ${validated.length} widget(s).${validated.length < incoming.length ? ` (${incoming.length - validated.length} failed validation)` : ""}`);
  }catch(error){
    setIsError(true);
    setMessage(error instanceof Error?error.message:"Import failed");
  }};

  return <Page title="Import & export" subtitle="Share widget configurations as portable JSON files."><div className="grid grid-cols-2 gap-4"><div className="feature-card flex-col items-start"><Download size={25}/><b>Import widgets</b><p>Select a Widget Studio JSON export. Imported widgets receive new IDs and are added to your workspace.</p><label className="primary-action cursor-pointer">Choose file<input className="hidden" type="file" accept="application/json,.json" onChange={e=>void importFile(e.target.files?.[0])}/></label></div><div className="feature-card flex-col items-start"><Cloud size={25}/><b>Export all widgets</b><p>Export {widgets.length} configured widget(s), including appearance, position and widget data.</p><button className="primary-action" disabled={!widgets.length} onClick={exportAll}>Export JSON</button></div></div>{message&&<div className={`content-panel mt-4 text-sm ${isError ? "border-red-500 bg-red-50 text-red-700" : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"}`}>{message}</div>}<Panel title="Individual widgets"><div className="space-y-2">{widgets.map(w=><div className="flex items-center rounded-lg bg-black/5 p-3 text-sm" key={w.id}><b>{w.name}</b><span className="ml-2 text-xs text-muted">{w.type}</span><button className="ml-auto text-indigo-600 dark:text-indigo-400 font-semibold" onClick={()=>downloadJson(`${safeName(w.name)}.widget.json`,{version:2,widgets:[w]})}>Export</button></div>)}</div></Panel></Page>
}

function downloadJson(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download=name;link.click();URL.revokeObjectURL(url)}
function safeName(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"widget"}

function Layouts({widgets,onSetWidgets}:{widgets:DesktopWidget[];onSetWidgets:(widgets:DesktopWidget[])=>void}){const {layouts,saveLayout,deleteLayout,renameLayout}=useManagerStore();return <Page title="Desktop layouts" subtitle="Save arrangements and switch context instantly." action={<button className="primary-action" onClick={()=>saveLayout(`Layout ${layouts.length+1}`,widgets)}><Plus size={15}/> Save current</button>}><div className="grid grid-cols-3 gap-4">{layouts.length===0?<div className="content-panel col-span-3 text-sm text-muted">No saved layouts. Save the current canvas to create one.</div>:layouts.map((x,i)=><div className="layout-card" key={x.id}><button className={`layout-preview lp-${i}`} onClick={()=>onSetWidgets(structuredClone(x.widgets))}><span/><span/><span/></button><div className="mt-3 flex items-center gap-2"><div className="flex-1 min-w-0"><input type="text" value={x.name} onChange={(e)=>renameLayout(x.id,e.target.value)} className="bg-transparent font-semibold outline-none border-b border-transparent hover:border-black/10 focus:border-accent w-full text-sm py-0.5" /><p className="text-[11px] text-muted mt-0.5">{x.widgets.length} widgets · {new Date(x.updatedAt).toLocaleDateString()}</p></div><button title="Delete layout" onClick={()=>deleteLayout(x.id)} className="ml-auto text-red-500 hover:text-red-700 px-1">×</button></div></div>)}</div></Page>}

function Performance({widgets}:{widgets:DesktopWidget[]}){const [info,setInfo]=useState<SystemInfo|null>(null);useEffect(()=>{const load=()=>void nativeApi.getSystemInfo().then(setInfo).catch(()=>setInfo(null));load();const id=setInterval(load,5000);return()=>clearInterval(id)},[]);const ram=info?`${(info.ram_used/1024/1024/1024).toFixed(1)} GB`:"Unavailable";return <Page title="Performance" subtitle="Live system metrics refresh every five seconds."><div className="grid grid-cols-3 gap-4"><div className="metric-card"><Cpu/><b className="mt-4 text-2xl">{info?`${info.cpu_usage.toFixed(1)}%`:"Unavailable"}</b><span>System CPU</span></div><div className="metric-card"><MemoryStick/><b className="mt-4 text-2xl">{ram}</b><span>System memory used</span></div><div className="metric-card"><Zap/><b className="mt-4 text-2xl">{widgets.length}</b><span>Configured widgets</span></div></div><Panel title="Widget configuration">{widgets.map(w=><div className="perf-row" key={w.id}><b>{w.name}</b><div className="perf-bar"><span style={{width:`${Math.min(100,w.settings.refreshInterval/3)}%`}}/></div><span>{w.settings.refreshInterval}s</span><span>{w.pinned?"Running":"Canvas"}</span></div>)}</Panel></Page>}

import { useSettingsStore } from "../../store/settingsStore";

function GenericPage({ view, widgets, onSetWidgets }: { view: ManagerView; widgets: DesktopWidget[]; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const { settings, updateSetting } = useSettingsStore();
  const { notices, markAllRead, lastBackup, backup, restoreBackup } = useManagerStore();
  const [successMsg, setSuccessMsg] = useState("");

  if (view === "settings") {
    return (
      <Page title="Settings" subtitle="Configure your global Widget Studio experience.">
        <div className="content-panel max-w-2xl space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <label className="developer-field">
              <span>Theme Brightness</span>
              <select value={settings.theme} onChange={(e) => updateSetting("theme", e.target.value as any)}>
                <option value="system">Follow System</option>
                <option value="light">Always Light</option>
                <option value="dark">Always Dark</option>
              </select>
            </label>
            <label className="developer-field">
              <span>Widget Background Mode</span>
              <select value={settings.widgetBackground} onChange={(e) => {
                const background = e.target.value as any;
                updateSetting("widgetBackground", background);
                onSetWidgets(widgets.map((w) => ({ ...w, settings: { ...w.settings, background } })));
              }}>
                <option value="glass">Glass (Acrylic Blur)</option>
                <option value="solid">Solid Tint</option>
                <option value="transparent">Fully Clear</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="checkbox" checked={settings.launchOnStartup} onChange={(e) => updateSetting("launchOnStartup", e.target.checked)} className="h-4 w-4 accent-accent" />
              <span>Launch application on startup</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="checkbox" checked={settings.restoreWidgetsOnLaunch} onChange={(e) => updateSetting("restoreWidgetsOnLaunch", e.target.checked)} className="h-4 w-4 accent-accent" />
              <span>Restore widget overlays on launch</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="checkbox" checked={settings.snapToGrid} onChange={(e) => updateSetting("snapToGrid", e.target.checked)} className="h-4 w-4 accent-accent" />
              <span>Snap canvas elements to grid</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="checkbox" checked={settings.lockPositions} onChange={(e) => updateSetting("lockPositions", e.target.checked)} className="h-4 w-4 accent-accent" />
              <span>Lock all widget coordinates</span>
            </label>
          </div>
        </div>
      </Page>
    );
  }

  if (view === "themes") {
    return (
      <Page title="Theme Studio" subtitle="Fine tune the acrylic layout, shadows, colors, and margins.">
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          <Panel title="Glassmorphism & Style">
            <div className="space-y-4 text-xs">
              <label className="developer-field">
                <span>Blur intensity ({settings.blurIntensity}px)</span>
                <input type="range" min="0" max="32" value={settings.blurIntensity} onChange={(e) => updateSetting("blurIntensity", Number(e.target.value))} className="w-full accent-accent" />
              </label>
              <label className="developer-field">
                <span>Shadow strength ({Math.round(settings.shadowIntensity * 100)}%)</span>
                <input type="range" min="0" max="0.35" step="0.01" value={settings.shadowIntensity} onChange={(e) => updateSetting("shadowIntensity", Number(e.target.value))} className="w-full accent-accent" />
              </label>
              <label className="developer-field">
                <span>Corner radius ({settings.cornerRadius}px)</span>
                <input type="range" min="4" max="28" value={settings.cornerRadius} onChange={(e) => {
                  updateSetting("cornerRadius", Number(e.target.value));
                  onSetWidgets(widgets.map((w) => ({ ...w, settings: { ...w.settings, radius: Number(e.target.value) } })));
                }} className="w-full accent-accent" />
              </label>
            </div>
          </Panel>
          <Panel title="Accent Palette">
            <div className="space-y-4 text-xs">
              <label className="developer-field">
                <span>Accent Color Override</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.accentColor} onChange={(e) => updateSetting("accentColor", e.target.value)} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                  <span className="font-mono text-muted">{settings.accentColor}</span>
                </div>
              </label>
              <div className="rounded-lg bg-black/5 p-2 dark:bg-white/5">
                <span className="font-semibold block mb-1">Color Theme Preset</span>
                <div className="text-[11px] text-muted">Currently active: <span className="font-semibold text-accent">{settings.colorTheme}</span></div>
              </div>
            </div>
          </Panel>
        </div>
      </Page>
    );
  }

  if (view === "automations") {
    return (
      <Page title="Automations" subtitle="Trigger automated changes based on desktop and battery events.">
        <div className="content-panel max-w-2xl text-sm space-y-4">
          <div className="p-3 bg-black/5 rounded-lg dark:bg-white/5 flex items-center justify-between">
            <div>
              <b className="block">Battery Saver Auto-mode</b>
              <span className="text-xs text-muted">Automatically disable background transparency & opacity when battery falls below 20%.</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-accent" />
            </label>
          </div>
          <div className="p-3 bg-black/5 rounded-lg dark:bg-white/5 flex items-center justify-between">
            <div>
              <b className="block">Workspace Focus Hours</b>
              <span className="text-xs text-muted">Hide all non-essential widgets when coding or when system is busy.</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="h-5 w-5 accent-accent" />
            </label>
          </div>
        </div>
      </Page>
    );
  }

  if (view === "permissions") {
    return (
      <Page title="Permissions" subtitle="Choose what each custom widget can access in its sandbox.">
        <div className="content-panel max-w-2xl text-sm space-y-3">
          <div className="flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/5">
            <b>Permission center</b>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">Default · off</span>
          </div>
          <div className="space-y-2">
            {[["Network Request (HTTPS)", "Allows widgets to reach external API forecast services."],
              ["System Clipboard", "Allows widgets to copy outputs directly to target inputs."],
              ["Desktop Notifications", "Allows widgets to push win11 style updates."],
              ["External URLs", "Allows opening links inside default web browsers."]].map(([name, desc]) => (
              <div key={name} className="flex items-start justify-between bg-black/5 p-2 rounded-md dark:bg-white/5">
                <div>
                  <b className="text-xs block">{name}</b>
                  <p className="text-[11px] text-muted">{desc}</p>
                </div>
                <span className="text-xs font-semibold text-muted">Controlled below</span>
              </div>
            ))}
          </div>
          {widgets.map((widget) => { const custom = widget.type === "custom"; const permissions = custom ? normalizeCustomWidgetData(widget.data).permissions : {}; return <section className="content-panel p-0" key={widget.id}><div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5"><div><b className="block truncate">{widget.name}</b><span className="text-[11px] text-muted">{custom ? "Custom widget · sandboxed" : "Built-in widget · trusted"}</span></div><span className="text-[11px] font-semibold text-emerald-500">{custom ? `${CUSTOM_WIDGET_PERMISSIONS.filter((permission) => permissions[permission]).length} allowed` : "Trusted"}</span></div>{custom ? <div className="divide-y divide-black/5 px-4 dark:divide-white/5">{CUSTOM_WIDGET_PERMISSIONS.map((permission) => <label className="flex cursor-pointer items-center justify-between gap-4 py-3" key={permission}><div><b className="block text-xs">{permissionInfo[permission].label}</b><span className="text-[11px] text-muted">{permissionInfo[permission].description}</span></div><input type="checkbox" checked={Boolean(permissions[permission])} onChange={(event) => onSetWidgets(widgets.map((item) => item.id === widget.id ? { ...item, data: { ...item.data, permissions: { ...permissions, [permission]: event.target.checked } } } : item))} className="h-5 w-5 accent-accent" /></label>)}</div> : <div className="px-4 py-3 text-xs text-muted">This widget has no special external permissions.</div>}</section>; })}
          {widgets.length === 0 && <div className="content-panel text-sm text-muted">No widgets installed yet.</div>}
        </div>
      </Page>
    );
  }

  if (view === "sync") {
    return (
      <Page title="Backup & Sync" subtitle="Preserve layout presets and widget configurations locally or in remote environments.">
        <SyncPage widgets={widgets} settings={settings} onSetWidgets={onSetWidgets} />
      </Page>
    );
  }

  if (view === "notifications") {
    return (
      <Page title="Notifications" subtitle="Recent alerts and activities pushed by system widgets.">
        <div className="content-panel max-w-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/5">
            <span className="text-xs font-semibold text-muted">{notices.length} notices</span>
            {notices.some(n => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notices.map((notice) => (
              <div key={notice.id} className={`flex items-start gap-3 p-3 rounded-lg text-xs ${notice.read ? "bg-black/5 text-muted dark:bg-white/5" : "bg-accent/10 border-l-2 border-accent"}`}>
                <span className="mt-0.5 font-bold">ℹ️</span>
                <div className="flex-1">
                  <p className="font-medium text-text">{notice.message}</p>
                  <span className="text-[10px] text-muted mt-1 block">{new Date(notice.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="text-xs text-muted text-center py-6">No recent activity reports or system notifications.</p>
            )}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={view.toUpperCase()} subtitle="System Panel">
      <div className="content-panel text-sm text-muted">Page is under construction.</div>
    </Page>
  );
}

export function ManagerPage({ view, widgets, onOpenWidgets, onSetWidgets, editingWidget, onPublishCustomWidget }: { view: ManagerView; widgets: DesktopWidget[]; onOpenWidgets: () => void; onSetWidgets: (widgets: DesktopWidget[]) => void; editingWidget: DesktopWidget | null; onPublishCustomWidget: (draft: import("../../types/customWidget").CustomWidgetDraft, existingWidget: DesktopWidget | null) => void }) {
  if (view === "dashboard") return <Dashboard widgets={widgets} onOpenWidgets={onOpenWidgets} onSetWidgets={onSetWidgets} />;
  if (view === "marketplace") return <ImportExport widgets={widgets} onSetWidgets={onSetWidgets} />;
  if (view === "layouts") return <Layouts widgets={widgets} onSetWidgets={onSetWidgets} />;
  if (view === "performance") return <Performance widgets={widgets} />;
  if (view === "developer") return <WidgetBuilder editingWidget={editingWidget} onPublish={onPublishCustomWidget} onCancel={onOpenWidgets} />;
  return <GenericPage view={view} widgets={widgets} onSetWidgets={onSetWidgets} />;
}

function Page({title,subtitle,action,children}:{title:string;subtitle:string;action?:React.ReactNode;children:React.ReactNode}){return <section className="manager-page"><header className="mb-5 flex items-start"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-muted">{subtitle}</p></div><div className="ml-auto">{action}</div></header>{children}</section>}
function Panel({title,action,children}:{title:string;action?:string;children:React.ReactNode}){return <section className="content-panel mt-4"><header className="mb-4 flex"><b>{title}</b>{action&&<button className="ml-auto text-xs text-indigo-600">{action}</button>}</header>{children}</section>}
function Quick({label,icon,onClick}:{label:string;icon:React.ReactNode;onClick?:()=>void}){return <button onClick={onClick} className="quick-action">{icon}<span>{label}</span></button>}
