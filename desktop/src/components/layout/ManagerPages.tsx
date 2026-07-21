import { ArrowUpRight, Bot, Check, CheckSquare, Cloud, Cpu, Download, Eye, EyeOff, HardDrive, Heart, LayoutGrid, MemoryStick, MoreHorizontal, Pin, Plus, Play, RotateCw, ShieldCheck, Sparkles, Star, Trash2, WandSparkles, Zap, Chrome, Lock, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ManagerView } from "./ManagerNavigation";
import type { DesktopWidget, WidgetKind } from "../../types/widget";
import { useManagerStore } from "../../store/managerStore";
import { useAuthStore, BACKEND_URL } from "../../store/authStore";
import { savePersistedState } from "../../lib/storage";
import { WidgetBuilder } from "../developer/WidgetBuilder";
import { useSystemInfo } from "../../hooks/useSystemInfo";
import { CUSTOM_WIDGET_PERMISSIONS, normalizeCustomWidgetData, type CustomWidgetPermission } from "../../types/customWidget";
import { isTauri, nativeApi } from "../../lib/tauri";
import { createWidget, useWidgetStore } from "../../store/widgetStore";
import { executeWidgetCommand } from "../../lib/widgetAgent";
import { AiProviderSection } from "../settings/AiProviderSection";



function SyncPage({ widgets, settings }: { widgets: DesktopWidget[]; settings: any; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-3xl">
      <Panel title="Local Storage Active">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <HardDrive size={24} />
            <div>
              <b className="block text-sm">Offline Local Storage</b>
              <span className="text-xs opacity-80">Saved directly on this device</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
              <span className="text-muted">Storage Mode</span>
              <span className="font-semibold text-emerald-500">100% LOCAL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
              <span className="text-muted">Active Widgets</span>
              <span className="font-semibold">{widgets.length}</span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Local Storage Information">
        <div className="space-y-3.5 text-xs text-muted leading-relaxed">
          <p>
            <b>💻 100% Local-First</b><br />
            Your widget layout, coordinates, styles, and data are stored safely on your machine without relying on external backends or cloud servers.
          </p>
          <p>
            <b>🛡️ Privacy First</b><br />
            No network authentication or remote server persistence is required.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Dashboard({ widgets, onOpenWidgets, onSetWidgets }: { widgets: DesktopWidget[]; onOpenWidgets: () => void; onSetWidgets?: (widgets: DesktopWidget[]) => void }) {
  const { backup, restoreBackup, lastBackup, notices } = useManagerStore();
  const { token, syncStatus, lastSyncedAt } = useAuthStore();
  const systemInfo = useSystemInfo();
  const sysCpu = systemInfo ? Math.round(systemInfo.cpu_usage) : null;
  const sysRam = systemInfo ? Math.round((systemInfo.ram_used / Math.max(systemInfo.ram_total, 1)) * 100) : null;

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
  const exportJson = async (name: string, value: unknown) => {
    try {
      await downloadJson(name, value);
      setIsError(false);
      setMessage(`Exported ${name}.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Export failed");
    }
  };
  const exportAll=()=>void exportJson("widget-studio-widgets.json",{version:2,widgets});
  
  const validateWidget = (w: any): w is DesktopWidget => {
    if (!w || typeof w !== "object") return false;
    if (typeof w.name !== "string" || !w.name) return false;
    const kinds: WidgetKind[] = ["clock", "weather", "todo", "notes", "system", "links", "calendar", "custom", "mindmap", "pomodoro", "worldclock", "stickynotes", "calculator", "chatbot", "browser"];
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

  return <Page title="Import & export" subtitle="Share widget configurations as portable JSON files."><div className="grid grid-cols-2 gap-4"><div className="feature-card flex-col items-start"><Download size={25}/><b>Import widgets</b><p>Select a Widget Studio JSON export. Imported widgets receive new IDs and are added to your workspace.</p><label className="primary-action cursor-pointer">Choose file<input className="hidden" type="file" accept="application/json,.json" onChange={e=>void importFile(e.target.files?.[0])}/></label></div><div className="feature-card flex-col items-start"><Cloud size={25}/><b>Export all widgets</b><p>Export {widgets.length} configured widget(s), including appearance, position and widget data.</p><button type="button" className="primary-action" disabled={!widgets.length} onClick={exportAll}>Export JSON</button></div></div>{message&&<div className={`content-panel mt-4 text-sm ${isError ? "border-red-500 bg-red-50 text-red-700" : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"}`}>{message}</div>}<Panel title="Individual widgets"><div className="space-y-2">{widgets.map(w=><div className="flex items-center rounded-lg bg-black/5 p-3 text-sm" key={w.id}><b>{w.name}</b><span className="ml-2 text-xs text-muted">{w.type}</span><button type="button" className="ml-auto text-indigo-600 dark:text-indigo-400 font-semibold" onClick={()=>void exportJson(`${safeName(w.name)}.widget.json`,{version:2,widgets:[w]})}>Export</button></div>)}</div></Panel></Page>
}

async function downloadJson(name:string,value:unknown){
  const contents = JSON.stringify(value, null, 2);
  if (isTauri) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const path = await save({
      defaultPath: name,
      filters: [{ name: "Widget Studio JSON", extensions: ["json"] }],
    });
    if (!path) return;
    await writeTextFile(path, contents);
    return;
  }
  const url=URL.createObjectURL(new Blob([contents],{type:"application/json"}));
  const link=document.createElement("a");
  link.href=url;
  link.download=name;
  link.style.display="none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function safeName(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"widget"}

function Layouts({widgets,onSetWidgets}:{widgets:DesktopWidget[];onSetWidgets:(widgets:DesktopWidget[])=>void}){
  const {layouts,saveLayout,deleteLayout,renameLayout,updateLayout}=useManagerStore();
  const [selectedId,setSelectedId]=useState<string | null>(layouts[0]?.id ?? null);
  const [draft,setDraft]=useState<DesktopWidget[]>([]);
  const [interaction,setInteraction]=useState<{id:string;mode:"move"|"resize";x:number;y:number;rect:DesktopWidget["rect"]}|null>(null);
  const canvasRef=useRef<HTMLDivElement>(null);
  const selected=layouts.find(layout=>layout.id===selectedId) ?? layouts[0];

  useEffect(()=>{ if(selected){setSelectedId(selected.id);setDraft(structuredClone(selected.widgets));} else {setDraft([]);} },[selected?.id]);
  const updateFromPointer=(event:React.PointerEvent)=>{
    if(!interaction||!canvasRef.current)return;
    const bounds=canvasRef.current.getBoundingClientRect();
    const dx=(event.clientX-interaction.x)/bounds.width*1920;
    const dy=(event.clientY-interaction.y)/bounds.height*1080;
    setDraft(items=>items.map(widget=>widget.id!==interaction.id?widget:{...widget,rect:interaction.mode==="move"?{...widget.rect,x:Math.max(0,Math.round(interaction.rect.x+dx)),y:Math.max(0,Math.round(interaction.rect.y+dy))}:{...widget.rect,width:Math.max(120,Math.round(interaction.rect.width+dx)),height:Math.max(80,Math.round(interaction.rect.height+dy))}}));
  };
  const beginInteraction=(event:React.PointerEvent,widget:DesktopWidget,mode:"move"|"resize")=>{event.stopPropagation();canvasRef.current?.setPointerCapture(event.pointerId);setInteraction({id:widget.id,mode,x:event.clientX,y:event.clientY,rect:{...widget.rect}});};
  const finishInteraction=()=>setInteraction(null);
  const apply=()=>{if(selected){updateLayout(selected.id,draft);onSetWidgets(structuredClone(draft));}};
  return <Page title="Desktop layouts" subtitle="Save arrangements and switch context instantly." action={<button className="primary-action" onClick={()=>saveLayout(`Layout ${layouts.length+1}`,widgets)}><Plus size={15}/> Save current</button>}>
    {layouts.length===0?<div className="content-panel text-sm text-muted">No saved layouts. Save the current canvas to create one.</div>:<div className="grid grid-cols-[minmax(0,1fr)_250px] gap-4">
      <section className="content-panel min-w-0"><div className="mb-3 flex items-center justify-between"><div><b>Editable canvas</b><p className="text-xs text-muted">Drag widgets to move them. Drag the corner to resize.</p></div><button className="primary-action text-xs" onClick={apply}>Save & apply</button></div>
        <div ref={canvasRef} className="layout-editor-canvas" onPointerMove={updateFromPointer} onPointerUp={finishInteraction} onPointerCancel={finishInteraction}>
          <div className="layout-editor-grid" />
          {draft.map(widget=><div key={widget.id} className={`layout-editor-widget ${widget.id===interaction?.id?"is-active":""}`} style={{left:`${widget.rect.x/1920*100}%`,top:`${widget.rect.y/1080*100}%`,width:`${widget.rect.width/1920*100}%`,height:`${widget.rect.height/1080*100}%`,zIndex:widget.zIndex??1}} onPointerDown={event=>beginInteraction(event,widget,"move")}><span>{widget.name}</span><small>{widget.type}</small><button aria-label={`Resize ${widget.name}`} className="layout-editor-resize" onPointerDown={event=>beginInteraction(event,widget,"resize")} /></div>)}
        </div>
      </section>
      <aside className="content-panel space-y-2"><b>Saved layouts</b>{layouts.map(layout=><div key={layout.id} className={`layout-editor-list-item ${layout.id===selected?.id?"is-selected":""}`}><button className="min-w-0 flex-1 text-left" onClick={()=>setSelectedId(layout.id)}><b className="block truncate text-sm">{layout.name}</b><span className="text-[11px] text-muted">{layout.widgets.length} widgets · {new Date(layout.updatedAt).toLocaleDateString()}</span></button><button title="Delete layout" onClick={()=>{deleteLayout(layout.id);if(layout.id===selected?.id)setSelectedId(layouts.find(item=>item.id!==layout.id)?.id??null);}} className="px-1 text-red-500">×</button><input aria-label="Rename layout" value={layout.name} onChange={event=>renameLayout(layout.id,event.target.value)} className="col-span-2 w-full border-b border-black/10 bg-transparent text-xs outline-none focus:border-accent dark:border-white/10" /></div>)}</aside>
    </div>}
  </Page>;
}

function Performance({widgets}:{widgets:DesktopWidget[]}){const info=useSystemInfo();const ram=info?`${(info.ram_used/1024/1024/1024).toFixed(1)} GB`:"Unavailable";const nameCounts=new Map<string,number>();const labels=widgets.map((widget)=>{const count=(nameCounts.get(widget.name)||0)+1;nameCounts.set(widget.name,count);return count===1?widget.name:`${widget.name} ${count}`});return <Page title="Performance" subtitle="Live system metrics refresh every five seconds."><div className="grid grid-cols-3 gap-4"><div className="metric-card"><Cpu/><b className="mt-4 text-2xl">{info?`${info.cpu_usage.toFixed(1)}%`:"Unavailable"}</b><span>System CPU</span></div><div className="metric-card"><MemoryStick/><b className="mt-4 text-2xl">{ram}</b><span>System memory used</span></div><div className="metric-card"><Zap/><b className="mt-4 text-2xl">{widgets.length}</b><span>Configured widgets</span></div></div><Panel title="Widget configuration">{widgets.map((w,index)=><div className="perf-row" key={w.id}><b>{labels[index]}</b><div className="perf-bar"><span style={{width:`${Math.min(100,w.settings.refreshInterval/3)}%`}}/></div><span>{w.settings.refreshInterval}s</span><span>{w.pinned?"Running":"Canvas"}</span></div>)}</Panel></Page>}

import { useSettingsStore } from "../../store/settingsStore";

function Automations({ widgets, onSetWidgets }: { widgets: DesktopWidget[]; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const { settings, updateSetting } = useSettingsStore();
  const systemInfo = useSystemInfo();
  const originalSettings = useRef(new Map<string, DesktopWidget["settings"]>());
  const originalHidden = useRef(new Map<string, boolean | undefined>());
  const batteryActive = settings.batterySaverAutomation && systemInfo?.battery_level != null && systemInfo.battery_level < 20;

  useEffect(() => {
    if (batteryActive) {
      onSetWidgets(widgets.map((widget) => {
        if (!originalSettings.current.has(widget.id)) originalSettings.current.set(widget.id, widget.settings);
        return { ...widget, settings: { ...widget.settings, background: "solid", opacity: Math.min(widget.settings.opacity, 0.7) } };
      }));
    } else if (originalSettings.current.size) {
      onSetWidgets(widgets.map((widget) => ({ ...widget, settings: originalSettings.current.get(widget.id) || widget.settings })));
      originalSettings.current.clear();
    }
  }, [batteryActive]);

  useEffect(() => {
    if (settings.focusHoursAutomation) {
      onSetWidgets(widgets.map((widget) => {
        if (!originalHidden.current.has(widget.id)) originalHidden.current.set(widget.id, widget.hidden);
        return ["clock", "calendar", "worldclock"].includes(widget.type) ? widget : { ...widget, hidden: true };
      }));
    } else if (originalHidden.current.size) {
      onSetWidgets(widgets.map((widget) => ({ ...widget, hidden: originalHidden.current.get(widget.id) })));
      originalHidden.current.clear();
    }
  }, [settings.focusHoursAutomation]);

  return <Page title="Automations" subtitle="Trigger automated changes based on desktop and battery events."><div className="content-panel max-w-2xl space-y-4 text-sm"><label className="flex cursor-pointer items-center justify-between rounded-lg bg-black/5 p-3 dark:bg-white/5"><div><b className="block">Battery Saver Auto-mode</b><span className="text-xs text-muted">Reduces widget transparency below 20% battery. Current battery: {systemInfo?.battery_level != null ? `${systemInfo.battery_level}%` : "unavailable"}.</span></div><input type="checkbox" checked={settings.batterySaverAutomation} onChange={() => updateSetting("batterySaverAutomation", !settings.batterySaverAutomation)} className="h-5 w-5 accent-accent" /></label><label className="flex cursor-pointer items-center justify-between rounded-lg bg-black/5 p-3 dark:bg-white/5"><div><b className="block">Workspace Focus Hours</b><span className="text-xs text-muted">Hides non-essential widgets while enabled; clocks and calendars remain visible.</span></div><input type="checkbox" checked={settings.focusHoursAutomation} onChange={() => updateSetting("focusHoursAutomation", !settings.focusHoursAutomation)} className="h-5 w-5 accent-accent" /></label></div></Page>;
}

function AIAgents({ widgets, onSetWidgets }: { widgets: DesktopWidget[]; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("Widget Agent is ready to manage your workspace.");
  const [activity, setActivity] = useState<string[]>([]);

  const runCommand = () => {
    if (!enabled) { setMessage("Widget Agent is paused."); return; }
    const result = executeWidgetCommand(command, widgets);
    if (result.widgets !== widgets) onSetWidgets(result.widgets);
    setMessage(result.message);
    setActivity((items) => [`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${result.message}`, ...items].slice(0, 6));
    setCommand("");
  };

  const todoCount = widgets.filter((widget) => widget.type === "todo").length;
  const completed = widgets.filter((widget) => widget.type === "todo").reduce((total, widget) => total + (Array.isArray(widget.data?.items) ? widget.data.items.filter((item: any) => item.done).length : 0), 0);
  return <Page title="AI Agent" subtitle="Control widget content, layout, visibility, and lifecycle from one command center.">
    <div className="grid grid-cols-2 gap-4 max-w-4xl">
      <section className="content-panel col-span-2 border-accent/20 bg-accent/[0.04]">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white"><Sparkles size={19}/></div><div><b className="block">Full widget control</b><p className="mt-1 text-xs text-muted">Commands run locally against the current widget state and persist through the normal local/cloud sync flow.</p></div></div>
        <div className="mt-4 flex gap-2"><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runCommand(); }} placeholder="Try: add link: OpenAI | https://openai.com" className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-white/5"/><button onClick={runCommand} disabled={!command.trim()} className="primary-action"><Play size={14}/> Run</button></div>
        <p className="mt-3 text-xs font-medium text-accent">{message}</p>
      </section>
      <AgentCard title="Widget Agent" description="Controls every installed widget and its built-in data through explicit local commands." icon={<Bot size={18}/>} enabled={enabled} onToggle={() => setEnabled((state) => !state)} onRun={() => { const result = executeWidgetCommand("list widgets", widgets); setMessage(result.message); setActivity((items) => [`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${result.message}`, ...items].slice(0, 6)); }} stats={`${widgets.length} installed widget${widgets.length === 1 ? "" : "s"} · ${todoCount} Todo · ${completed} tasks completed`} />
      <section className="content-panel col-span-2"><header className="mb-3 flex items-center gap-2"><WandSparkles size={16} className="text-accent"/><b>Supported controls</b></header><p className="text-xs leading-6 text-muted">List or create widgets; show, hide, pin, lock, unlock, unpin, or remove them; add and complete Todo tasks; replace Notes text; change Weather location; add Quick Links and Sticky Notes; switch Pomodoro mode. Use <code>Label | URL</code> for links and <code>Title | Content</code> for sticky notes.</p></section>
      <section className="content-panel col-span-2"><b>Recent agent activity</b>{activity.length ? <div className="mt-3 space-y-2 text-xs text-muted">{activity.map((item, index) => <div key={`${item}-${index}`} className="rounded-lg bg-black/[0.04] px-3 py-2 dark:bg-white/[0.05]">{item}</div>)}</div> : <p className="mt-3 text-xs text-muted">Run a command or quick control to see activity here.</p>}</section>
    </div>
  </Page>;
}

function AgentCard({ title, description, icon, enabled, onToggle, onRun, stats }: { title: string; description: string; icon: React.ReactNode; enabled: boolean; onToggle: () => void; onRun: () => void; stats: string }) {
  return <section className="content-panel"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b>{title}</b><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-black/10 text-muted dark:bg-white/10"}`}>{enabled ? "Active" : "Paused"}</span></div><p className="mt-1 text-xs leading-relaxed text-muted">{description}</p><p className="mt-3 text-[11px] font-medium text-muted">{stats}</p></div></div><div className="mt-4 flex items-center gap-2"><button onClick={onToggle} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold dark:border-white/10">{enabled ? "Pause agent" : "Enable agent"}</button><button onClick={onRun} disabled={!enabled} className="primary-action ml-auto text-xs"><Play size={13}/> Run now</button></div></section>;
}

const permissionInfo: Record<CustomWidgetPermission, { label: string; description: string }> = {
  network: { label: "Network access", description: "Connect to HTTPS APIs and external services." },
  clipboard: { label: "Clipboard", description: "Copy text to the Windows clipboard." },
  notifications: { label: "Notifications", description: "Send desktop notifications." },
  openExternal: { label: "Open external links", description: "Open approved HTTP(S) links in your browser." }
};

function WindowsPermissions({ widgets, onSetWidgets }: { widgets: DesktopWidget[]; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const togglePermission = (widgetId: string, permission: CustomWidgetPermission, enabled: boolean) => {
    onSetWidgets(widgets.map((widget) => {
      if (widget.id !== widgetId || widget.type !== "custom") return widget;
      const data = normalizeCustomWidgetData(widget.data);
      return { ...widget, data: { ...widget.data, permissions: { ...data.permissions, [permission]: enabled } } };
    }));
  };
  const toggleWidget = (widgetId: string, enabled: boolean) => {
    onSetWidgets(widgets.map((widget) => widget.id === widgetId ? { ...widget, hidden: !enabled } : widget));
  };
  return <Page title="Windows permissions" subtitle="Manage what each widget can access on this Windows desktop."><div className="max-w-3xl space-y-4"><div className="content-panel flex items-start gap-3 text-sm"><ShieldCheck className="mt-0.5 text-emerald-500" size={22}/><div><b>Permission center</b><p className="mt-1 text-xs leading-relaxed text-muted">The signed Widget Studio app keeps its native Windows capabilities restricted to the desktop package. The controls below manage sandbox permissions for each custom widget; built-in widgets remain trusted and do not request external access.</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600">Window management · enabled</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600">Notifications · enabled</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600">User files · scoped</span></div></div></div>{widgets.map((widget) => { const custom = widget.type === "custom"; const permissions = custom ? normalizeCustomWidgetData(widget.data).permissions : {}; const enabled = !widget.hidden; return <section className="content-panel p-0" key={widget.id}><div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 dark:border-white/5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><ShieldCheck size={18}/></div><div className="min-w-0"><b className="block truncate">{widget.name}</b><span className="text-[11px] text-muted">{custom ? "Custom app · sandboxed" : "Built-in app · no special permissions"}</span></div><span className={`ml-auto mr-3 text-[11px] font-semibold ${enabled ? "text-emerald-500" : "text-muted"}`}>{enabled ? (custom ? `${CUSTOM_WIDGET_PERMISSIONS.filter((permission) => permissions[permission]).length} allowed` : "Trusted") : "Disabled"}</span><ToggleSwitch enabled={enabled} onChange={(next) => toggleWidget(widget.id, next)} label={`${widget.name} widget`} /></div>{custom ? <div className="divide-y divide-black/5 px-4 dark:divide-white/5">{CUSTOM_WIDGET_PERMISSIONS.map((permission) => <label className="flex cursor-pointer items-center justify-between gap-4 py-3" key={permission}><div><b className="block text-xs">{permissionInfo[permission].label}</b><span className="text-[11px] text-muted">{permissionInfo[permission].description}</span></div><input type="checkbox" checked={Boolean(permissions[permission])} onChange={(event) => togglePermission(widget.id, permission, event.target.checked)} className="h-5 w-5 accent-accent" /></label>)}</div> : <div className="px-4 py-3 text-xs text-muted">This app runs with the standard Widget Studio sandbox and does not access external services.</div>}</section>; })}{widgets.length === 0 && <div className="content-panel text-sm text-muted">No installed widgets yet. Create a custom widget to manage its permissions.</div>}</div></Page>;
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (enabled: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={`Turn ${label} ${enabled ? "off" : "on"}`} onClick={() => onChange(!enabled)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "left-6" : "left-1"}`} /></button>;
}

function GenericPage({ view, widgets, onSetWidgets }: { view: ManagerView; widgets: DesktopWidget[]; onSetWidgets: (widgets: DesktopWidget[]) => void }) {
  const { settings, updateSetting } = useSettingsStore();
  const { notices, markAllRead, lastBackup, backup, restoreBackup } = useManagerStore();
  const [successMsg, setSuccessMsg] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const openUninstallSettings = async () => {
    if (!window.confirm("Open Windows Installed apps to uninstall Widget Studio?")) return;

    setSettingsError("");
    try {
      await nativeApi.openUninstallSettings();
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Could not open Windows Installed apps.");
    }
  };

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
          <AiProviderSection />
          <div className="flex items-center justify-between gap-4 border-t border-black/10 pt-4 dark:border-white/10">
            <div>
              <b className="block text-sm">Uninstall Widget Studio</b>
              <p className="mt-1 text-xs text-muted">Open Windows Installed apps, then confirm removal of Widget Studio.</p>
              {settingsError && <p className="mt-1 text-xs font-semibold text-red-500">{settingsError}</p>}
            </div>
            <button
              type="button"
              onClick={() => void openUninstallSettings()}
              disabled={!isTauri}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
              title={isTauri ? "Open Windows Installed apps" : "Available in the desktop app"}
            >
              <Trash2 size={15} />
              Uninstall
            </button>
          </div>
        </div>
      </Page>
    );
  }

  if (view === "themes") {
    const THEME_PRESETS = [
      { id: "berry-pop", name: "Berry Pop", color: "#8b5cf6" },
      { id: "citrus-splash", name: "Citrus Splash", color: "#facc15" },
      { id: "ocean-candy", name: "Ocean Candy", color: "#3b82f6" },
      { id: "lavender-dream", name: "Lavender Dream", color: "#ec4899" },
      { id: "mint-sorbet", name: "Mint Sorbet", color: "#5eead4" },
      { id: "midnight-neon", name: "Midnight Neon", color: "#22d3ee" }
    ];

    return (
      <Page title="Theme Studio" subtitle="Fine tune the acrylic glass layout, blur radius, shadows, and custom colors.">
        <div className="grid grid-cols-2 gap-4 max-w-4xl">
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

          <Panel title="Accent & Palette Presets">
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold block mb-2">Color Theme Palette Presets</span>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => updateSetting("colorTheme", preset.id as any)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                        settings.colorTheme === preset.id
                          ? "border-accent bg-accent/10 font-bold"
                          : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: preset.color }} />
                      <span className="truncate text-[11px]">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="developer-field pt-2 border-t border-black/5 dark:border-white/5">
                <span>Accent Color Override</span>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.accentColor} onChange={(e) => updateSetting("accentColor", e.target.value)} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                  <span className="font-mono text-xs font-semibold">{settings.accentColor}</span>
                </div>
              </label>
            </div>
          </Panel>

          <section className="content-panel col-span-2">
            <span className="font-semibold text-xs block mb-3">Live Widget Glass Preview</span>
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 flex items-center justify-center">
              <div
                className="acrylic p-4 w-64 shadow-xl border border-white/40 dark:border-white/10 flex flex-col gap-2 text-xs"
                style={{
                  borderRadius: `${settings.cornerRadius}px`,
                  backdropFilter: `blur(${settings.blurIntensity}px)`
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Sample Widget</span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: settings.accentColor }} />
                </div>
                <p className="text-muted text-[11px]">Real-time preview of glass blur, corner radius, and accent styling.</p>
                <button type="button" className="mt-2 py-1 px-2 text-white font-medium text-[10px] rounded-md transition hover:brightness-110" style={{ backgroundColor: settings.accentColor }}>
                  Interactive Button
                </button>
              </div>
            </div>
          </section>
        </div>
      </Page>
    );
  }

  if (view === "automations") {
    return <Automations widgets={widgets} onSetWidgets={onSetWidgets} />;
  }

  if (view === "permissions") {
    return <WindowsPermissions widgets={widgets} onSetWidgets={onSetWidgets} />;
    /* legacy capability summary
    return (
      <Page title="App permissions" subtitle="Choose what each widget app can access on this device.">
        <div className="content-panel max-w-2xl text-sm space-y-3">
          <div className="flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/5">
            <b>Sandboxed Capabilities</b>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">4 APIs enabled</span>
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
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            ))}
          </div>
        </div>
      </Page>
    ); */
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
  if (view === "agents") return <AIAgents widgets={widgets} onSetWidgets={onSetWidgets} />;
  if (view === "developer") return <WidgetBuilder editingWidget={editingWidget} onPublish={onPublishCustomWidget} onCancel={onOpenWidgets} />;
  return <GenericPage view={view} widgets={widgets} onSetWidgets={onSetWidgets} />;
}

function Page({title,subtitle,action,children}:{title:string;subtitle:string;action?:React.ReactNode;children:React.ReactNode}){return <section className="manager-page"><header className="mb-5 flex items-start"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-muted">{subtitle}</p></div><div className="ml-auto">{action}</div></header>{children}</section>}
function Panel({title,action,children}:{title:string;action?:string;children:React.ReactNode}){return <section className="content-panel mt-4"><header className="mb-4 flex"><b>{title}</b>{action&&<button className="ml-auto text-xs text-indigo-600">{action}</button>}</header>{children}</section>}
function Quick({label,icon,onClick}:{label:string;icon:React.ReactNode;onClick?:()=>void}){return <button onClick={onClick} className="quick-action">{icon}<span>{label}</span></button>}
