import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppWindow, EyeOff, Grid3X3, Moon, Pin, Redo2, RotateCcw, Search, Undo2 } from "lucide-react";
import { loadPersistedState, savePersistedState } from "./lib/storage";
import { nativeApi } from "./lib/tauri";
import { useSettingsStore } from "./store/settingsStore";
import { createWidget, useWidgetStore } from "./store/widgetStore";
import { customWidgetDataFromDraft } from "./types/customWidget";
import { WidgetGallery } from "./components/layout/WidgetGallery";
import { WidgetFrame } from "./components/layout/WidgetFrame";
import { WidgetInspector } from "./components/layout/WidgetInspector";
import { ManagerNavigation, type ManagerView } from "./components/layout/ManagerNavigation";
import { ManagerPage } from "./components/layout/ManagerPages";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { Button } from "./components/ui/Button";
import { hexToRgb } from "./lib/colors";
import { openWidgetOverlay, closeWidgetOverlay } from "./lib/widgetActions";

import { useAuthStore } from "./store/authStore";
import { isTauri } from "./lib/tauri";
import { useRouteStore } from "./store/routeStore";
import { WebHeader } from "./components/website/WebHeader";
import { WebFooter } from "./components/website/WebFooter";
import { LandingPage } from "./components/website/LandingPage";
import { FeaturesPage } from "./components/website/FeaturesPage";
import { AuthPage } from "./components/website/AuthPage";
import { DownloadPage } from "./components/website/DownloadPage";
import { FaqPage } from "./components/website/FaqPage";

export default function App() {
  const widgetWindowId = new URLSearchParams(window.location.search).get("widget");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [managerView, setManagerView] = useState<ManagerView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);
  const [developerWidgetId, setDeveloperWidgetId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const reportError = (error: any, context: string) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error during ${context}:`, error);
    setErrorToast(`Action Failed (${context}): ${msg}`);
    setTimeout(() => setErrorToast(null), 5000);
  };
  const widgets = useWidgetStore((state) => state.widgets);
  const addWidget = useWidgetStore((state) => state.addWidget);
  const hydrate = useWidgetStore((state) => state.hydrate);
  const setWidgets = useWidgetStore((state) => state.setWidgets);
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const updateRect = useWidgetStore((state) => state.updateRect);
  const undo = useWidgetStore((state) => state.undo);
  const redo = useWidgetStore((state) => state.redo);
  const canUndo = useWidgetStore((state) => state.past.length > 0);
  const canRedo = useWidgetStore((state) => state.future.length > 0);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const settings = useSettingsStore((state) => state.settings);
  const persisted = useMemo(() => ({ version: 2, widgets, settings }), [widgets, settings]);
  const isWidgetWindow = Boolean(widgetWindowId);
  const selectedWidget = widgets.find((widget) => widget.id === selectedWidgetId) ?? null;

  // Initialize auth session and load state
  useEffect(() => {
    useAuthStore.getState().initialize();
    
    loadPersistedState().then((state) => {
      const restoredSettings = state.version < 2 ? { ...state.settings, launchOnStartup: true } : state.settings;
      
      // If the user already finished onboarding, we respect their choice of having 0 widgets
      const restoredWidgets = (!isWidgetWindow && state.widgets.length === 0 && !restoredSettings.onboardingComplete)
        ? [createWidget("clock"), createWidget("todo", 1)]
        : state.widgets;

      hydrate({ ...state, version: 2, widgets: restoredWidgets, settings: restoredSettings });
      setSettings(restoredSettings);
      if (!isWidgetWindow && restoredWidgets.length > 0) setSelectedWidgetId(restoredWidgets[0].id);

      if (!isWidgetWindow) {
        if (restoredSettings.launchOnStartup) {
          void nativeApi.setStartup(true).catch((e) => reportError(e, "launch on startup"));
        }

        if (state.settings.restoreWidgetsOnLaunch) {
          window.setTimeout(() => {
            restoredWidgets
              .filter((widget) => widget.pinned)
              .forEach((widget) => {
                void nativeApi
                  .openWidgetWindow(widget.id, widget.rect.x, widget.rect.y, widget.rect.width, widget.rect.height)
                  .catch((e) => reportError(e, `restore widget overlay "${widget.name}"`));
              });
          }, 500);
        }
      }
    });
  }, [hydrate, isWidgetWindow, setSettings]);

  // Deep Link handler for OAuth redirects
  useEffect(() => {
    let unlisten: any;
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      import("@tauri-apps/plugin-deep-link").then(({ onOpenUrl }) => {
        onOpenUrl((urls) => {
          console.log("Deep link URL received:", urls);
          for (const url of urls) {
            // Support both callback formats (with trailing slash or path parameters)
            if (url.startsWith("widgetapp://auth/callback")) {
              const urlObj = new URL(url);
              const token = urlObj.searchParams.get("token");
              const email = urlObj.searchParams.get("email");
              if (token && email) {
                useAuthStore.getState().setSession(token, email);
                // Trigger instant cloud layout loading
                loadPersistedState().then((state) => {
                  hydrate(state);
                  setSettings(state.settings);
                });
              }
            }
          }
        }).then((fn) => {
          unlisten = fn;
        });
      }).catch((e) => {
        console.warn("Failed to initialize Tauri deep link plugin:", e);
      });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, [hydrate, setSettings]);

  useEffect(() => {
    let activeTheme = settings.theme;
    if (isWidgetWindow && widgetWindowId) {
      const currentWidget = widgets.find((w) => w.id === widgetWindowId);
      if (currentWidget?.settings?.theme) {
        activeTheme = currentWidget.settings.theme;
      }
    }

    document.documentElement.dataset.theme = activeTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : activeTheme;
    document.documentElement.dataset.colorTheme = settings.colorTheme;
    document.documentElement.style.setProperty("--accent", hexToRgb(settings.accentColor));
  }, [settings.theme, settings.colorTheme, settings.accentColor, isWidgetWindow, widgetWindowId, widgets]);

  useEffect(() => {
    const timer = window.setTimeout(() => void savePersistedState(persisted), 300);
    return () => window.clearTimeout(timer);
  }, [persisted]);

  useEffect(() => {
    if (!selectedWidgetId || widgets.some((widget) => widget.id === selectedWidgetId)) return;
    setSelectedWidgetId(widgets[0]?.id ?? null);
  }, [selectedWidgetId, widgets]);
  useEffect(()=>setSelectedWidgetIds(ids=>ids.filter(id=>widgets.some(widget=>widget.id===id))),[widgets]);

  useEffect(() => {
    if (isWidgetWindow) return;
    const selectPendingWidget = () => {
      const id = window.localStorage.getItem("desktop-widgets-select");
      if (!id) return;
      window.localStorage.removeItem("desktop-widgets-select");
      if (widgets.some((widget) => widget.id === id)) setSelectedWidgetId(id);
    };

    selectPendingWidget();
    window.addEventListener("focus", selectPendingWidget);

    // Listen to native events (like tray commands) if running in Tauri
    let unlisten: any;
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      import("@tauri-apps/api/event").then(({ listen }) => {
        listen("menu-settings", () => {
          setManagerView("settings");
        }).then((fn) => {
          unlisten = fn;
        });
      });
    }

    return () => {
      window.removeEventListener("focus", selectPendingWidget);
      if (unlisten) unlisten();
    };
  }, [isWidgetWindow, widgets]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "p"))) { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") setSearchOpen(false);
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z") { event.preventDefault(); event.shiftKey?redo():undo(); }
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y") { event.preventDefault(); redo(); }
      if (selectedWidgetId && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key) && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); const ids=selectedWidgetIds.length?selectedWidgetIds:[selectedWidgetId];const amount=event.shiftKey?10:1;useWidgetStore.getState().widgets.filter(w=>ids.includes(w.id)&&!w.locked).forEach(widget=>updateRect(widget.id,{x:widget.rect.x+(event.key==="ArrowLeft"?-amount:event.key==="ArrowRight"?amount:0),y:widget.rect.y+(event.key==="ArrowUp"?-amount:event.key==="ArrowDown"?amount:0)}))}
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [redo,selectedWidgetId,selectedWidgetIds,undo,updateRect]);

  const openAll = () => {
    widgets.forEach((widget) => {
      void openWidgetOverlay(widget, updateWidget, reportError);
    });
  };

  const hideAll = () => {
    widgets.forEach((widget) => {
      void closeWidgetOverlay(widget, updateWidget, reportError);
    });
  };

  const resetLayout = () => {
    const canvasWidth = Math.max(640, window.innerWidth - 280 - 320 - 48);
    const gap = 20;
    const top = 150;
    let x = gap;
    let y = top;
    let rowHeight = 0;

    setWidgets(widgets.map((widget) => {
      if (x > gap && x + widget.rect.width > canvasWidth) {
        x = gap;
        y += rowHeight + gap;
        rowHeight = 0;
      }
      const next = { ...widget, rect: { ...widget.rect, x, y } };
      x += widget.rect.width + gap;
      rowHeight = Math.max(rowHeight, widget.rect.height);
      return next;
    }));
  };

  const alignSelection=(axis:"left"|"top"|"horizontal"|"vertical")=>{const chosen=widgets.filter(w=>selectedWidgetIds.includes(w.id));if(chosen.length<2)return;if(axis==="left"){const x=Math.min(...chosen.map(w=>w.rect.x));chosen.forEach(w=>updateRect(w.id,{x}))}else if(axis==="top"){const y=Math.min(...chosen.map(w=>w.rect.y));chosen.forEach(w=>updateRect(w.id,{y}))}else{const sorted=[...chosen].sort((a,b)=>axis==="horizontal"?a.rect.x-b.rect.x:a.rect.y-b.rect.y);const first=axis==="horizontal"?sorted[0].rect.x:sorted[0].rect.y;const last=axis==="horizontal"?sorted[sorted.length-1].rect.x:sorted[sorted.length-1].rect.y;sorted.forEach((w,i)=>updateRect(w.id,axis==="horizontal"?{x:first+(last-first)*i/(sorted.length-1)}:{y:first+(last-first)*i/(sorted.length-1)}))}};

  const { currentRoute, setRoute } = useRouteStore();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (currentRoute === "dashboard" && !token) {
      setRoute("auth");
    }
  }, [currentRoute, token, setRoute]);

  if (widgetWindowId) {
    const widget = widgets.find((item) => item.id === widgetWindowId);
    return (
      <main className="h-full bg-transparent text-text">
        {widget && <WidgetFrame widget={widget} overlay />}
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] text-white">
      <WebHeader />
      
      <main className="flex-1">
        {currentRoute === "landing" && <LandingPage />}
        {currentRoute === "features" && <FeaturesPage />}
        {currentRoute === "auth" && <AuthPage />}
        {currentRoute === "download" && <DownloadPage />}
        {currentRoute === "faq" && <FaqPage />}
        {currentRoute === "dashboard" && (
          <div className="h-[calc(100vh-70px)] p-4 bg-surface/80 flex flex-col">
            {/* Web Banner */}
            <div className="mb-3 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-between">
              <span>✨ Web Preview Mode: Layout updates sync to the cloud database automatically. Install the Desktop app to pin them to your wallpaper workspace.</span>
              <button onClick={() => setRoute("download")} className="underline hover:text-white">Get Desktop App</button>
            </div>
            
            <div className="flex flex-1 min-h-0 gap-2">
              <ManagerNavigation view={managerView} onView={(view) => { if (view === "developer") setDeveloperWidgetId(null); setManagerView(view); }} onSearch={() => setSearchOpen(true)} />
              {managerView !== "widgets" ? (
                <ManagerPage 
                  view={managerView} 
                  widgets={widgets} 
                  onSetWidgets={setWidgets} 
                  editingWidget={developerWidgetId ? widgets.find((widget) => widget.id === developerWidgetId) ?? null : null}
                  onPublishCustomWidget={(draft, existingWidget) => { const data = customWidgetDataFromDraft(draft) as Record<string, unknown>; if (existingWidget) { updateWidget(existingWidget.id, { name: draft.name, data }); setSelectedWidgetId(existingWidget.id); } else { const widget = createWidget("custom", widgets.length); widget.name = draft.name; widget.data = data; setWidgets([...widgets, widget]); setSelectedWidgetId(widget.id); } setDeveloperWidgetId(null); setManagerView("widgets"); }}
                  onOpenWidgets={() => setManagerView("widgets")} 
                />
              ) : (
                <>
                   <WidgetGallery selectedWidgetId={selectedWidgetId} onSelectWidget={setSelectedWidgetId} onSettings={() => setManagerView("settings")} onOpenDeveloper={(id) => { setDeveloperWidgetId(id); setManagerView("developer"); }} />
                  <section
                    className="widget-canvas relative flex-1 overflow-hidden"
                    onPointerDown={(event) => {
                      if (event.target === event.currentTarget) {setSelectedWidgetId(null);setSelectedWidgetIds([])}
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const type = event.dataTransfer.getData("application/widget-kind");
                      if (!type) return;
                      const canvasRect = event.currentTarget.getBoundingClientRect();
                      const dropX = (event.clientX - canvasRect.left) / (canvasZoom / 100);
                      const dropY = (event.clientY - canvasRect.top) / (canvasZoom / 100);
                      const newWidget = addWidget(type as any, { rect: { x: Math.round(dropX), y: Math.round(dropY) } });
                      setSelectedWidgetId(newWidget.id);
                    }}
                  >
                    <div className="absolute left-0 right-0 top-0 z-20 rounded-t-xl border-b border-black/10 bg-panel/80 backdrop-blur-xl dark:border-white/10">
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <span className="mr-auto text-sm font-semibold text-text/80">Canvas</span>
                        <Button disabled={!canUndo} icon={<Undo2 size={14}/>} onClick={undo}>Undo</Button>
                        <Button disabled={!canRedo} icon={<Redo2 size={14}/>} onClick={redo}>Redo</Button>
                        <div className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />
                        <Button disabled={widgets.length === 0} icon={<Pin size={14} />} onClick={openAll}>Open all</Button>
                        <Button disabled={widgets.length === 0} icon={<EyeOff size={14} />} onClick={hideAll}>Hide all</Button>
                        <Button disabled={widgets.length === 0} icon={<RotateCcw size={14} />} onClick={resetLayout}>Reset</Button>
                      </div>
                    </div>
                    {widgets.length === 0 && (
                      <div className="flex h-full items-center justify-center px-8 text-center text-muted">
                        <div>
                          <div className="text-lg font-semibold text-text">Choose a widget from the sidebar</div>
                          <p className="mt-2 max-w-sm text-sm">Use the plus button to edit on this canvas, or the pin button to open it directly as a desktop overlay.</p>
                        </div>
                      </div>
                    )}
                    <div style={{transform:`scale(${canvasZoom/100})`,transformOrigin:"top left"}}><AnimatePresence>
                      {widgets.map((widget) => (
                        <WidgetFrame
                          key={widget.id}
                          widget={widget}
                          selected={widget.id === selectedWidgetId}
                          onSelect={(additive) => {setSelectedWidgetId(widget.id);setSelectedWidgetIds(ids=>additive?(ids.includes(widget.id)?ids.filter(id=>id!==widget.id):[...ids,widget.id]):[widget.id])}}
                        />
                      ))}
                    </AnimatePresence></div>
                    <div className="canvas-status absolute bottom-0 left-0 right-0 z-20 flex h-10 items-center gap-2 border-t border-black/10 bg-panel/85 px-3 text-xs text-muted backdrop-blur-xl">
                      <div className="flex items-center rounded-lg bg-black/5"><button className="px-2.5 py-1.5" onClick={()=>setCanvasZoom(x=>Math.max(50,x-10))}>−</button><span className="px-2 text-text">{canvasZoom}%</span><button className="px-2.5 py-1.5" onClick={()=>setCanvasZoom(x=>Math.min(200,x+10))}>＋</button></div>
                      <div className="mx-auto" />
                      <button onClick={()=>updateSetting("snapToGrid",!settings.snapToGrid)} className="flex items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-1.5"><Grid3X3 size={13} /> Grid <span className={settings.snapToGrid?"toggle-on":"toggle-off"} /></button>
                      <button className="icon-tile" onClick={()=>updateSetting("theme",settings.theme==="dark"?"light":"dark")}><Moon size={14} /></button>
                    </div>
                  </section>
                   <WidgetInspector widget={selectedWidget} onSelectWidget={setSelectedWidgetId} onOpenDeveloper={(id) => { setDeveloperWidgetId(id); setManagerView("developer"); }} />
                </>
              )}
            </div>
          </div>
        )}
      </main>
      
      <WebFooter />
      {searchOpen && <CommandPalette onClose={()=>setSearchOpen(false)} onView={setManagerView} onCreate={()=>{const w=createWidget("clock",widgets.length);setWidgets([...widgets,w]);setSelectedWidgetId(w.id);setManagerView("widgets")}} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function CommandPalette({onClose,onView,onCreate}:{onClose:()=>void;onView:(v:ManagerView)=>void;onCreate:()=>void}) {
 const [query,setQuery]=useState(""); const actions=[{label:"Create new widget",run:onCreate},{label:"Open Theme Studio",run:()=>onView("themes")},{label:"Open Marketplace",run:()=>onView("marketplace")},{label:"Open Desktop Layouts",run:()=>onView("layouts")},{label:"Open Performance",run:()=>onView("performance")}].filter(x=>x.label.toLowerCase().includes(query.toLowerCase()));
 return <div className="command-backdrop" onPointerDown={onClose}><div className="command-palette" onPointerDown={e=>e.stopPropagation()}><div className="flex items-center gap-3 border-b border-black/10 px-4"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} autoFocus placeholder="Search widgets, layouts, themes and actions…"/><kbd>Esc</kbd></div>{actions.map(x=><button key={x.label} onClick={()=>{x.run();onClose()}}>{x.label}<span>Action</span></button>)}</div></div>
}
