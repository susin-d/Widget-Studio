import { motion, useDragControls } from "framer-motion";
import { Check, Copy, EyeOff, GripHorizontal, Lock, Pin, Trash2, Unlock } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import type { DesktopWidget, ThemeMode, WidgetBackground } from "../../types/widget";
import { isTauri, nativeApi } from "../../lib/tauri";
import { useSettingsStore } from "../../store/settingsStore";
import { useWidgetStore } from "../../store/widgetStore";
import { CalendarWidget } from "../widgets/CalendarWidget";
import { ClockWidget } from "../widgets/ClockWidget";
import { NotesWidget } from "../widgets/NotesWidget";
import { QuickLinksWidget } from "../widgets/QuickLinksWidget";
import { SystemMonitorWidget } from "../widgets/SystemMonitorWidget";
import { TodoWidget } from "../widgets/TodoWidget";
import { WeatherWidget } from "../widgets/WeatherWidget";
import { CustomWidget } from "../widgets/CustomWidget";
import { MindmapWidget } from "../widgets/MindmapWidget";
import { PomodoroWidget } from "../widgets/PomodoroWidget";
import { WorldClockWidget } from "../widgets/WorldClockWidget";
import { StickyNotepadWidget } from "../widgets/StickyNotepadWidget";
import { CalculatorWidget } from "../widgets/CalculatorWidget";
import { ChatbotWidget } from "../widgets/ChatbotWidget";
import { BrowserWidget } from "../widgets/BrowserWidget";
import { hexToRgb } from "../../lib/colors";
import { openWidgetOverlay, closeWidgetOverlay, toggleWidgetLock, deleteWidget } from "../../lib/widgetActions";

interface WidgetFrameProps {
  widget: DesktopWidget;
  overlay?: boolean;
  selected?: boolean;
  onSelect?: (additive: boolean) => void;
}

function WidgetFrameComponent({ widget, overlay = false, selected = false, onSelect }: WidgetFrameProps) {
  const frameRef = useRef<HTMLElement | null>(null);
  const lockPositions = useSettingsStore((state) => state.settings.lockPositions);
  const desktopMode = useSettingsStore((state) => state.settings.desktopMode);
  const snapToGrid = useSettingsStore((state) => state.settings.snapToGrid);
  const blurIntensity = useSettingsStore((state) => state.settings.blurIntensity);
  const shadowIntensity = useSettingsStore((state) => state.settings.shadowIntensity);
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const duplicateWidget = useWidgetStore((state) => state.duplicateWidget);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const updateRect = useWidgetStore((state) => state.updateRect);
  const updateSettings = useWidgetStore((state) => state.updateSettings);
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const locked = widget.locked || widget.pinned || lockPositions;
  const isDesktopWidget = overlay || (desktopMode && widget.pinned);
  const canDrag = !overlay && !locked;
  const dragControls = useDragControls();
  const backgroundClass = widget.settings.background === "transparent" ? "bg-transparent" : widget.settings.background === "solid" ? (widget.settings.color ? "widget-solid-tint" : "bg-panel/90") : "acrylic";
  const desktopThemeClass = widget.settings.theme === "light" ? "text-black" : "text-white drop-shadow-[0_2px_8px_rgb(0_0_0_/_0.65)]";

  const togglePinned = () => {
    if (widget.pinned) {
      void closeWidgetOverlay(widget, updateWidget);
    } else {
      void openWidgetOverlay(widget, updateWidget);
    }
  };

  const toggleLock = () => {
    void toggleWidgetLock(widget, updateWidget);
  };

  useEffect(() => {
    if (!overlay) return;
    const window = getCurrentWindow();
    const frame = frameRef.current;
    if (!frame) return;

    const syncWindowSize = () => {
      const rect = frame.getBoundingClientRect();
      const menuElement = frame.querySelector<HTMLElement>("[data-menu]");
      const menuRect = menuElement?.getBoundingClientRect();
      const menuLeft = menuElement ? menuElement.offsetLeft : 0;
      const menuTop = menuElement ? menuElement.offsetTop : 0;
      const width = Math.ceil(Math.max(rect.width, menuRect ? menuLeft + menuRect.width : 0));
      const height = Math.ceil(Math.max(rect.height, menuRect ? menuTop + menuRect.height : 0));
      if (width <= 0 || height <= 0) return;
      void window.setSize(new LogicalSize(width, height)).catch(() => undefined);
    };

    syncWindowSize();
    const observer = new ResizeObserver(syncWindowSize);
    observer.observe(frame);
    const menuElement = frame.querySelector<HTMLElement>("[data-menu]");
    if (menuElement) observer.observe(menuElement);
    return () => observer.disconnect();
  }, [overlay, widget.id, widget.settings.background, widget.settings.fontSize, widget.type, widget.data, menu]);

  useEffect(() => {
    if (!overlay) return;
    let cleanup: (() => void) | undefined;
    let resizeCleanup: (() => void) | undefined;
    let animationFrame: number | null = null;
    let pendingPosition: { x: number; y: number } | null = null;
    let pendingSize: { width: number; height: number } | null = null;
    let scaleFactor = 1;
    const window = getCurrentWindow();

    void window.scaleFactor().then((value) => { scaleFactor = value; }).catch(() => undefined);
    void window
      .onMoved(({ payload }) => {
        pendingPosition = payload.toLogical(scaleFactor);
        if (animationFrame !== null) return;
        animationFrame = requestAnimationFrame(() => {
          animationFrame = null;
          if (!pendingPosition) return;
          updateRect(widget.id, {
            x: Math.round(pendingPosition.x),
            y: Math.round(pendingPosition.y)
          });
        });
      })
      .then((unlisten) => {
        cleanup = unlisten;
      })
      .catch(() => undefined);

    void window
      .onResized(({ payload }) => {
        const size = payload.toLogical(scaleFactor);
        pendingSize = {
          width: Math.max(180, Math.round(size.width)),
          height: Math.max(150, Math.round(size.height))
        };
        if (animationFrame !== null) return;
        animationFrame = requestAnimationFrame(() => {
          animationFrame = null;
          if (pendingPosition) {
            updateRect(widget.id, {
              x: Math.round(pendingPosition.x),
              y: Math.round(pendingPosition.y)
            });
            pendingPosition = null;
          }
          if (pendingSize) {
            updateRect(widget.id, pendingSize);
            pendingSize = null;
          }
        });
      })
      .then((unlisten) => {
        resizeCleanup = unlisten;
      })
      .catch(() => undefined);

    return () => {
      cleanup?.();
      resizeCleanup?.();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [overlay, updateRect, widget.id]);

  if (widget.hidden && !overlay) return null;

  return (
    <motion.section
      ref={frameRef}
      drag={canDrag}
      dragControls={dragControls}
      dragListener={!isDesktopWidget}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (!canDrag) return;
        const grid = snapToGrid ? 12 : 1;
        const x = Math.round((widget.rect.x + info.offset.x) / grid) * grid;
        const y = Math.round((widget.rect.y + info.offset.y) / grid) * grid;
        updateRect(widget.id, {
          x,
          y
        });
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, x: overlay ? 0 : widget.rect.x, y: overlay ? 0 : widget.rect.y }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={`group absolute ${isDesktopWidget ? `overflow-visible select-none border border-transparent ${widget.settings.background === "transparent" ? "p-0" : "p-4 shadow-widget"} ${desktopThemeClass}` : "overflow-hidden border border-white/30 p-4 shadow-widget"} ${backgroundClass}`}
      style={{
        width: widget.rect.width,
        height: widget.rect.height,
        minWidth: overlay ? 180 : undefined,
        minHeight: overlay ? 150 : undefined,
        borderRadius: widget.settings.radius,
        zIndex: widget.pinned ? 0 : (widget.zIndex ?? 10),
        "--widget-opacity": widget.settings.opacity,
        "--blur-radius": `${blurIntensity}px`,
        "--shadow-strength": String(shadowIntensity),
        "--widget-tint": widget.settings.color ? hexToRgb(widget.settings.color) : undefined,
        "--accent": widget.settings.barColor ? hexToRgb(widget.settings.barColor) : undefined,
        "--text": widget.settings.textColor ? hexToRgb(widget.settings.textColor) : undefined,
        "--muted": widget.settings.textColor ? hexToRgb(widget.settings.textColor) : undefined,
        color: widget.settings.textColor || undefined
      } as CSSProperties}
      onPointerDown={(event) => {
        if (overlay) return;
        event.stopPropagation();
        onSelect?.(event.ctrlKey || event.metaKey || event.shiftKey);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (!isDesktopWidget) return;
        if (overlay) {
          const rect = frameRef.current?.getBoundingClientRect();
          setMenu({ x: Math.ceil(rect?.width ?? 0) + 10, y: 0 });
          return;
        }
        setMenu({ x: event.clientX - widget.rect.x, y: event.clientY - widget.rect.y });
      }}
      onPointerDownCapture={(event) => {
        if (!overlay || event.button !== 0 || isInteractiveTarget(event.target)) return;
        void getCurrentWindow().startDragging().catch(() => undefined);
      }}
    >
      {!isDesktopWidget && selected && <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-accent ring-offset-2 ring-offset-surface" />}
      {isDesktopWidget && (
        <button
          title="Move widget"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (overlay) {
              void getCurrentWindow().startDragging().catch(() => undefined);
              return;
            }
            dragControls.start(event);
          }}
          className="absolute right-0 top-0 z-10 flex h-7 w-9 cursor-move select-none items-center justify-center rounded-md bg-black/20 text-white/70 opacity-50 backdrop-blur-sm transition hover:bg-black/35 hover:text-white hover:opacity-100"
        >
          <GripHorizontal size={16} />
        </button>
      )}
      {!isDesktopWidget && isTauri && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <input
            value={widget.name}
            onChange={(event) => updateWidget(widget.id, { name: event.target.value })}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          />
          <button title={widget.pinned ? "Unpin and close desktop widget" : "Pin and open desktop widget"} onClick={togglePinned} className="rounded-md p-1 opacity-70 hover:bg-black/10 hover:opacity-100">
            <Pin size={15} className={widget.pinned ? "fill-current text-accent" : ""} />
          </button>
        </header>
      )}
      <div className={`${isDesktopWidget ? "h-full w-full overflow-hidden" : "h-[calc(100%-36px)] overflow-hidden"}`} style={{ fontSize: widget.settings.fontSize }}>
        <WidgetBody widget={widget} overlay={overlay} />
      </div>
      {!isDesktopWidget && isTauri && <div className="absolute right-2 top-11 hidden rounded-lg bg-panel/95 p-1 shadow-win group-hover:flex">
        <IconAction label="Duplicate" icon={<Copy size={14} />} onClick={() => duplicateWidget(widget.id)} />
        <IconAction
          label="Open as desktop widget"
          icon={<Pin size={14} className={widget.pinned ? "fill-current text-accent" : ""} />}
          onClick={() => {
            void openWidgetOverlay(widget, updateWidget);
          }}
        />
        <IconAction label={widget.pinned ? "Unpin and unlock" : widget.locked ? "Unlock" : "Lock"} icon={widget.locked || widget.pinned ? <Unlock size={14} /> : <Lock size={14} />} onClick={toggleLock} />
        <IconAction
          label="Remove"
          icon={<Trash2 size={14} />}
          danger
          onClick={() => {
            void deleteWidget(widget, removeWidget);
          }}
        />
      </div>}
      {(!locked || overlay) && (
        <div
          data-resize-handle
          className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-br-lg border-b-2 border-r-2 border-muted/60"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (overlay) {
              void getCurrentWindow().startResizeDragging("SouthEast").catch(() => undefined);
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            const startX = event.clientX;
            const startY = event.clientY;
            const start = widget.rect;
            let animationFrame: number | null = null;
            let pendingRect = { width: start.width, height: start.height };
            const applyResize = () => {
              animationFrame = null;
              updateRect(widget.id, pendingRect);
            };
            const move = (moveEvent: PointerEvent) => {
              pendingRect = {
                width: Math.max(180, start.width + moveEvent.clientX - startX),
                height: Math.max(150, start.height + moveEvent.clientY - startY)
              };
              if (animationFrame === null) animationFrame = requestAnimationFrame(applyResize);
            };
            const up = () => {
              if (animationFrame !== null) cancelAnimationFrame(animationFrame);
              applyResize();
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        />
      )}
      {isDesktopWidget && menu && (
        <DesktopWidgetMenu
          x={menu.x}
          y={menu.y}
          widget={widget}
          onClose={() => setMenu(null)}
          onEdit={() => {
            updateSetting("desktopMode", false);
            window.localStorage.setItem("desktop-widgets-select", widget.id);
            void nativeApi.showWindow().catch(() => undefined);
            setMenu(null);
          }}
          onRemove={() => {
            removeWidget(widget.id);
            void nativeApi.closeWidgetWindow(widget.id).catch(() => undefined);
            if (overlay) void getCurrentWindow().close().catch(() => undefined);
          }}
          onHide={() => {
            updateWidget(widget.id, { pinned: false, locked: false });
            void nativeApi.closeWidgetWindow(widget.id).catch(() => undefined);
            if (overlay) void getCurrentWindow().close().catch(() => undefined);
          }}
          onBackground={(background) => updateSettings(widget.id, { background })}
          onTheme={(theme) => updateSettings(widget.id, { theme })}
        />
      )}
    </motion.section>
  );
}

export const WidgetFrame = memo(
  WidgetFrameComponent,
  (previous, next) => previous.widget === next.widget && previous.overlay === next.overlay && previous.selected === next.selected
);

function DesktopWidgetMenu({
  x,
  y,
  widget,
  onClose,
  onEdit,
  onRemove,
  onHide,
  onBackground,
  onTheme
}: {
  x: number;
  y: number;
  widget: DesktopWidget;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onHide: () => void;
  onBackground: (background: WidgetBackground) => void;
  onTheme: (theme: ThemeMode) => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [onClose]);

  return (
    <div
      data-menu
      className="absolute z-50 w-44 overflow-hidden rounded-lg border border-white/15 bg-black/80 p-1 text-xs text-white shadow-win backdrop-blur-xl"
      style={{ left: x, top: y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuButton label="Edit widgets" onClick={onEdit} />
      <MenuButton label="Hide widget" icon={<EyeOff size={12} />} onClick={onHide} />
      <MenuSeparator />
      <MenuGroup label="Theme">
        {(["system", "light", "dark"] as ThemeMode[]).map((theme) => (
          <MenuButton key={theme} label={titleCase(theme)} active={widget.settings.theme === theme} onClick={() => onTheme(theme)} />
        ))}
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup label="Background">
        {(["transparent", "glass", "solid"] as WidgetBackground[]).map((background) => (
          <MenuButton key={background} label={titleCase(background)} active={widget.settings.background === background} onClick={() => onBackground(background)} />
        ))}
      </MenuGroup>
      <MenuSeparator />
      <MenuButton label="Remove widget" danger icon={<Trash2 size={12} />} onClick={onRemove} />
    </div>
  );
}

function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/45">{label}</div>
      {children}
    </div>
  );
}

function MenuButton({ label, icon, active, danger, onClick }: { label: string; icon?: ReactNode; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-white/10 ${danger ? "text-red-300" : ""}`}
      onClick={onClick}
    >
      <span className="flex w-3.5 justify-center">{active ? <Check size={12} /> : icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button, input, textarea, select, label, a, [data-menu], [data-resize-handle]"));
}


function WidgetBody({ widget, overlay }: { widget: DesktopWidget; overlay?: boolean }) {
  if (widget.type === "custom") return <CustomWidget widget={widget} />;
  if (widget.type === "clock") return <ClockWidget />;
  if (widget.type === "weather") return <WeatherWidget widget={widget} />;
  if (widget.type === "todo") return <TodoWidget widget={widget} />;
  if (widget.type === "notes") return <NotesWidget widget={widget} />;
  if (widget.type === "system") return <SystemMonitorWidget />;
  if (widget.type === "links") return <QuickLinksWidget widget={widget} />;
  if (widget.type === "mindmap") return <MindmapWidget widget={widget} />;
  if (widget.type === "pomodoro") return <PomodoroWidget widget={widget} />;
  if (widget.type === "worldclock") return <WorldClockWidget widget={widget} />;
  if (widget.type === "stickynotes") return <StickyNotepadWidget widget={widget} />;
  if (widget.type === "calculator") return <CalculatorWidget />;
  if (widget.type === "chatbot") return <ChatbotWidget widget={widget} />;
  if (widget.type === "browser") return <BrowserWidget widget={widget} overlay={overlay} />;
  return <CalendarWidget widget={widget} />;
}

function IconAction({ label, icon, danger, onClick }: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }) {
  return <button title={label} onClick={onClick} className={`rounded-md p-2 hover:bg-black/10 ${danger ? "text-red-500" : ""}`}>{icon}</button>;
}
