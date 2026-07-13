import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppWindow, Download, EyeOff, Grid3X3, LoaderCircle, Moon, Pin, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { loadLocalPersistedState, loadPersistedState, resetCloudSyncCursor, saveLocalPersistedState, savePersistedState, syncPersistedStateToCloud } from "./lib/storage";
import { isTauri, nativeApi } from "./lib/tauri";
import { checkForUpdates, installUpdate } from "./lib/updater";
import { useSettingsStore } from "./store/settingsStore";
import { createWidget, useWidgetStore } from "./store/widgetStore";
import { customWidgetDataFromDraft } from "./types/customWidget";
import { WidgetGallery } from "./components/layout/WidgetGallery";
import { WidgetFrame } from "./components/layout/WidgetFrame";
import { WidgetInspector } from "./components/layout/WidgetInspector";
import { ManagerNavigation, type ManagerView } from "./components/layout/ManagerNavigation";
import { Button } from "./components/ui/Button";
import { hexToRgb } from "./lib/colors";
import { openWidgetOverlay, closeWidgetOverlay } from "./lib/widgetActions";

import { useAuthStore } from "./store/authStore";
import type { PersistedState, WidgetKind } from "./types/widget";
import type { Update } from "@tauri-apps/plugin-updater";

const ManagerPage = lazy(() => import("./components/layout/ManagerPages").then((module) => ({ default: module.ManagerPage })));
const CommandPalette = lazy(() => import("./components/layout/CommandPalette").then((module) => ({ default: module.CommandPalette })));

export function App() {
  const widgetWindowId = new URLSearchParams(window.location.search).get("widget");
  const [managerView, setManagerView] = useState<ManagerView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);
  const [developerWidgetId, setDeveloperWidgetId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateState, setUpdateState] = useState<"idle" | "checking" | "installing">("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const reportError = useCallback((error: any, context: string) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error during ${context}:`, error);
    setErrorToast(`Action Failed (${context}): ${msg}`);
    setTimeout(() => setErrorToast(null), 5000);
  }, []);

  const checkForAppUpdates = useCallback(async (showErrors = false) => {
    if (!isTauri) return;
    setUpdateState("checking");
    try {
      const update = await checkForUpdates();
      setAvailableUpdate(update);
      setUpdateError(null);
    } catch (error) {
      console.warn("Automatic update check failed:", error);
      if (showErrors) setUpdateError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdateState("idle");
    }
  }, []);

  const installAvailableUpdate = useCallback(async () => {
    if (!availableUpdate) return;
    setUpdateState("installing");
    setUpdateProgress(0);
    setUpdateError(null);
    try {
      await installUpdate(availableUpdate, setUpdateProgress);
    } catch (error) {
      console.error("Update installation failed:", error);
      setUpdateState("idle");
      setUpdateError(error instanceof Error ? error.message : String(error));
    }
  }, [availableUpdate]);
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
  const canvasScale = canvasZoom / 100;
  const canvasBounds = useMemo(() => ({
    width: Math.max(960, ...widgets.map((widget) => widget.rect.x + widget.rect.width + 96)),
    height: Math.max(640, ...widgets.map((widget) => widget.rect.y + widget.rect.height + 96))
  }), [widgets]);
  const token = useAuthStore((state) => state.token);
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const sessionSource = useAuthStore((state) => state.sessionSource);
  const initialStateLoaded = useRef(false);
  const handledSessionVersion = useRef(0);

  const handleManagerViewChange = useCallback((view: ManagerView) => {
    if (view === "developer") setDeveloperWidgetId(null);
    setManagerView(view);
  }, []);

  const addWidgetFromPalette = useCallback((type: WidgetKind) => {
    const widget = addWidget(type);
    setSelectedWidgetId(widget.id);
    setSelectedWidgetIds([widget.id]);
    setManagerView("widgets");
  }, [addWidget]);

  const openWidgetFromPalette = useCallback((id: string) => {
    setSelectedWidgetId(id);
    setSelectedWidgetIds([id]);
    setManagerView("widgets");
  }, []);

  const applyLoadedState = useCallback((state: PersistedState) => {
    const restoredSettings = state.version < 2 ? { ...state.settings, launchOnStartup: true } : state.settings;
    const restoredWidgets = (!isWidgetWindow && state.widgets.length === 0 && !restoredSettings.onboardingComplete)
      ? [createWidget("clock"), createWidget("todo", 1)]
      : state.widgets;

    hydrate({ ...state, version: 2, widgets: restoredWidgets, settings: restoredSettings });
    setSettings(restoredSettings);
    if (!isWidgetWindow && restoredWidgets.length > 0) setSelectedWidgetId(restoredWidgets[0].id);

    if (!isWidgetWindow) {
      if (restoredSettings.launchOnStartup) {
        void nativeApi.setStartup(true).catch((error) => reportError(error, "launch on startup"));
      }

      if (restoredSettings.restoreWidgetsOnLaunch) {
        window.setTimeout(() => {
          restoredWidgets
            .filter((widget) => widget.pinned)
            .forEach((widget) => {
              void nativeApi
                .openWidgetWindow(widget.id, widget.rect.x, widget.rect.y, widget.rect.width, widget.rect.height)
                .catch((error) => reportError(error, `restore widget overlay "${widget.name}"`));
            });
        }, 500);
      }
    }
  }, [hydrate, isWidgetWindow, reportError, setSettings]);

  // Initialize auth session and load state
  useEffect(() => {
    const loadState = isWidgetWindow ? loadLocalPersistedState : loadPersistedState;
    if (!isWidgetWindow) useAuthStore.getState().initialize();
    loadState().then((state) => {
      applyLoadedState(state);
      initialStateLoaded.current = true;
    });
  }, [applyLoadedState, isWidgetWindow]);

  useEffect(() => {
    if (isWidgetWindow || !isTauri) return;
    const timer = window.setTimeout(() => void checkForAppUpdates(), 2500);
    return () => window.clearTimeout(timer);
  }, [checkForAppUpdates, isWidgetWindow]);

  // Email/password and web OAuth establish a session after the initial load. Pull the
  // cloud layout for login/OAuth, while a new signup publishes the current local layout.
  useEffect(() => {
    if (isWidgetWindow || !initialStateLoaded.current || !token || sessionVersion === handledSessionVersion.current) return;
    handledSessionVersion.current = sessionVersion;

    if (sessionSource === "signup") {
      resetCloudSyncCursor();
      void savePersistedState(persisted);
      return;
    }

    void loadPersistedState().then(applyLoadedState);
  }, [applyLoadedState, isWidgetWindow, persisted, sessionSource, sessionVersion, token]);

  // Deep Link handler for OAuth redirects
  useEffect(() => {
    if (isWidgetWindow) return;
    let unlistenDeepLink: (() => void) | undefined;
    let unlistenSingleInstance: (() => void) | undefined;
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const handleUrls = (urls: string[]) => {
        console.log("Deep link URL received:", urls);
        for (const url of urls) {
          // Support both callback formats (with trailing slash or path parameters)
          if (url.startsWith("widgetapp://auth/callback")) {
            try {
              const urlObj = new URL(url);
              const token = urlObj.searchParams.get("token");
              const email = urlObj.searchParams.get("email");
              if (token && email) {
                void nativeApi.showWindow().catch((error) => {
                  console.warn("Could not restore Widget Studio after OAuth:", error);
                });
                useAuthStore.getState().setSession(token, email, "oauth");
              }
            } catch (error) {
              console.warn("Ignoring malformed Widget Studio OAuth callback:", error);
            }
          }
        }
      };

      import("@tauri-apps/plugin-deep-link").then(({ getCurrent, onOpenUrl }) => {
        // Windows passes a custom-protocol URL as a startup argument. The live
        // event alone is not enough when the browser launches a new process.
        void getCurrent()
          .then((urls) => { if (urls?.length) handleUrls(urls); })
          .catch((error) => console.warn("Could not read startup deep link:", error));

        return onOpenUrl(handleUrls).then((unlisten) => { unlistenDeepLink = unlisten; });
      }).catch((e) => {
        console.warn("Failed to initialize Tauri deep link plugin:", e);
      });

      // The native single-instance guard forwards URLs from blocked secondary
      // launches so OAuth still completes in the already-running application.
      import("@tauri-apps/api/event")
        .then(({ listen }) => listen<string[]>("single-instance-deep-links", ({ payload }) => handleUrls(payload)))
        .then((unlisten) => { unlistenSingleInstance = unlisten; })
        .catch((error) => console.warn("Failed to listen for secondary launch URLs:", error));
    }
    return () => {
      unlistenDeepLink?.();
      unlistenSingleInstance?.();
    };
  }, [hydrate, isWidgetWindow, setSettings]);

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
    if (isWidgetWindow || !initialStateLoaded.current) return;

    const localTimer = window.setTimeout(() => void saveLocalPersistedState(persisted), 250);
    const cloudTimer = window.setTimeout(() => void syncPersistedStateToCloud(persisted), 1800);
    return () => {
      window.clearTimeout(localTimer);
      window.clearTimeout(cloudTimer);
    };
  }, [isWidgetWindow, persisted]);

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
    if (isWidgetWindow) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "p"))) { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") setSearchOpen(false);
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z") { event.preventDefault(); event.shiftKey?redo():undo(); }
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y") { event.preventDefault(); redo(); }
      if (selectedWidgetId && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key) && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); const ids=selectedWidgetIds.length?selectedWidgetIds:[selectedWidgetId];const amount=event.shiftKey?10:1;useWidgetStore.getState().widgets.filter(w=>ids.includes(w.id)&&!w.locked).forEach(widget=>updateRect(widget.id,{x:widget.rect.x+(event.key==="ArrowLeft"?-amount:event.key==="ArrowRight"?amount:0),y:widget.rect.y+(event.key==="ArrowUp"?-amount:event.key==="ArrowDown"?amount:0)}))}
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [isWidgetWindow,redo,selectedWidgetId,selectedWidgetIds,undo,updateRect]);

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

  if (widgetWindowId) {
    const widget = widgets.find((item) => item.id === widgetWindowId);
    return (
      <main className="h-full bg-transparent text-text">
        {widget && <WidgetFrame widget={widget} overlay />}
      </main>
    );
  }

  if (!settings.onboardingComplete) {
    return (
      <main className="flex h-full items-center justify-center bg-surface p-8">
        <section className="max-w-xl rounded-2xl bg-panel/90 p-8 shadow-win">
          <div className="mb-5 flex items-center gap-3">
            <img src="/widget-studio-logo.png" alt="Widget Studio" className="app-logo h-12 w-12 rounded-2xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Welcome to</p>
              <h1 className="text-2xl font-semibold">Widget Studio</h1>
            </div>
          </div>
          <p className="mt-3 text-muted">Add lightweight Windows 11-style widgets, move them around your desktop, and tune the glass, theme, and layout to match your workflow.</p>
          <Button className="mt-6" variant="primary" onClick={() => updateSetting("onboardingComplete", true)}>Start customizing</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell flex h-full flex-col bg-surface/80 text-text">
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
      <ManagerNavigation view={managerView} onView={handleManagerViewChange} onSearch={() => setSearchOpen(true)} />
      {managerView !== "widgets" ? <Suspense fallback={<div className="content-panel flex-1 text-sm text-muted">Loading workspace…</div>}><ManagerPage view={managerView} widgets={widgets} onSetWidgets={setWidgets} editingWidget={developerWidgetId ? widgets.find((widget) => widget.id === developerWidgetId) ?? null : null} onPublishCustomWidget={(draft, existingWidget) => { const data = customWidgetDataFromDraft(draft) as Record<string, unknown>; if (existingWidget) { updateWidget(existingWidget.id, { name: draft.name, data }); setSelectedWidgetId(existingWidget.id); } else { const widget = createWidget("custom", widgets.length); widget.name = draft.name; widget.data = data; setWidgets([...widgets, widget]); setSelectedWidgetId(widget.id); } setDeveloperWidgetId(null); setManagerView("widgets"); }} onOpenWidgets={() => setManagerView("widgets")} /></Suspense> : <>
      <WidgetGallery selectedWidgetId={selectedWidgetId} onSelectWidget={setSelectedWidgetId} onOpenDeveloper={(id) => { setDeveloperWidgetId(id); setManagerView("developer"); }} />
      <section
        className="widget-canvas relative min-h-0 min-w-0 flex-1 overflow-auto"
      >
        <div className="sticky left-0 right-0 top-0 z-20 rounded-t-xl border-b border-black/10 bg-panel/80 backdrop-blur-xl dark:border-white/10">
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
        <div
          className="relative"
          style={{
            width: canvasBounds.width * canvasScale,
            height: canvasBounds.height * canvasScale,
            minWidth: "100%",
            minHeight: "calc(100% - 84px)"
          }}
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
            const dropX = (event.clientX - canvasRect.left) / canvasScale;
            const dropY = (event.clientY - canvasRect.top) / canvasScale;
            const newWidget = addWidget(type as any, { rect: { x: Math.round(dropX), y: Math.round(dropY) } });
            setSelectedWidgetId(newWidget.id);
          }}
        >
          {widgets.length === 0 && (
            <div className="flex h-full items-center justify-center px-8 text-center text-muted">
              <div>
                <div className="text-lg font-semibold text-text">Choose a widget from the sidebar</div>
                <p className="mt-2 max-w-sm text-sm">Use the plus button to edit on this canvas, or the pin button to open it directly as a desktop overlay.</p>
              </div>
            </div>
          )}
          <div style={{width:canvasBounds.width,height:canvasBounds.height,transform:`scale(${canvasScale})`,transformOrigin:"top left"}}><AnimatePresence>
            {widgets.map((widget) => (
              <WidgetFrame
                key={widget.id}
                widget={widget}
                selected={widget.id === selectedWidgetId}
                onSelect={(additive) => {setSelectedWidgetId(widget.id);setSelectedWidgetIds(ids=>additive?(ids.includes(widget.id)?ids.filter(id=>id!==widget.id):[...ids,widget.id]):[widget.id])}}
              />
            ))}
          </AnimatePresence></div>
        </div>
        <div className="canvas-status sticky bottom-0 left-0 right-0 z-20 flex h-10 items-center gap-2 border-t border-black/10 bg-panel/85 px-3 text-xs text-muted backdrop-blur-xl">
          <div className="flex items-center rounded-lg bg-black/5"><button className="px-2.5 py-1.5" onClick={()=>setCanvasZoom(x=>Math.max(50,x-10))}>−</button><span className="px-2 text-text">{canvasZoom}%</span><button className="px-2.5 py-1.5" onClick={()=>setCanvasZoom(x=>Math.min(200,x+10))}>＋</button></div>
          <div className="mx-auto" />
          <button onClick={()=>updateSetting("snapToGrid",!settings.snapToGrid)} className="flex items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-1.5"><Grid3X3 size={13} /> Grid <span className={settings.snapToGrid?"toggle-on":"toggle-off"} /></button>
          <button className="icon-tile" onClick={()=>updateSetting("theme",settings.theme==="dark"?"light":"dark")}><Moon size={14} /></button>
        </div>
      </section>
      <WidgetInspector widget={selectedWidget} onSelectWidget={setSelectedWidgetId} onOpenDeveloper={(id) => { setDeveloperWidgetId(id); setManagerView("developer"); }} />
      </>}
      </div>
      {searchOpen && <Suspense fallback={null}><CommandPalette
        widgets={widgets}
        onClose={() => setSearchOpen(false)}
        onView={handleManagerViewChange}
        onCreateWidget={addWidgetFromPalette}
        onOpenWidget={openWidgetFromPalette}
      /></Suspense>}
      {availableUpdate && (
        <div className="fixed right-6 top-14 z-50 w-[min(28rem,calc(100vw-3rem))] rounded-xl border border-accent/30 bg-panel/95 p-4 shadow-win backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent/15 p-2 text-accent"><Download size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Widget Studio {availableUpdate.version} is ready</p>
              <p className="mt-1 text-xs text-muted">{availableUpdate.body || "Download and install the latest signed desktop build."}</p>
              {updateError && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{updateError}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => void installAvailableUpdate()} disabled={updateState === "installing"} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-70">
                  {updateState === "installing" ? <><LoaderCircle size={13} className="animate-spin" /> Installing {updateProgress}%</> : "Install update"}
                </button>
                <button type="button" onClick={() => setAvailableUpdate(null)} disabled={updateState === "installing"} className="rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5">Later</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {errorToast && (
        <div className="fixed bottom-16 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-4 text-xs font-medium text-red-800 shadow-win dark:bg-red-950/90 dark:text-red-200">
          <span>⚠️ {errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}
    </main>
  );
}
