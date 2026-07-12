import { CalendarDays, CheckSquare, Clock, CloudSun, Code2, Copy, Cpu, EyeOff, Link, NotebookPen, Pin, Plus, Settings, Trash2, GitFork, Timer, Globe, StickyNote, Calculator, Bot } from "lucide-react";
import type { ReactNode } from "react";
import { nativeApi } from "../../lib/tauri";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget, WidgetKind } from "../../types/widget";
import { Button } from "../ui/Button";

const gallery: Array<{ type: WidgetKind; label: string; icon: ReactNode }> = [
  { type: "clock", label: "Clock", icon: <Clock size={16} /> },
  { type: "weather", label: "Weather", icon: <CloudSun size={16} /> },
  { type: "todo", label: "Todo", icon: <CheckSquare size={16} /> },
  { type: "notes", label: "Notes", icon: <NotebookPen size={16} /> },
  { type: "system", label: "System", icon: <Cpu size={16} /> },
  { type: "links", label: "Quick Links", icon: <Link size={16} /> },
  { type: "calendar", label: "Calendar", icon: <CalendarDays size={16} /> },
  { type: "mindmap", label: "Mindmap", icon: <GitFork size={16} /> },
  { type: "pomodoro", label: "Focus Timer", icon: <Timer size={16} /> },
  { type: "worldclock", label: "World Clock", icon: <Globe size={16} /> },
  { type: "stickynotes", label: "Sticky Notepad", icon: <StickyNote size={16} /> },
  { type: "calculator", label: "Calculator", icon: <Calculator size={16} /> },
  { type: "chatbot", label: "AI Chatbot", icon: <Bot size={16} /> },
];

interface WidgetGalleryProps {
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onSettings: () => void;
  onOpenDeveloper?: (id: string) => void;
}

export function WidgetGallery({ selectedWidgetId, onSelectWidget, onSettings, onOpenDeveloper }: WidgetGalleryProps) {
  const widgets = useWidgetStore((state) => state.widgets);
  const addWidget = useWidgetStore((state) => state.addWidget);
  const duplicateWidget = useWidgetStore((state) => state.duplicateWidget);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const updateWidget = useWidgetStore((state) => state.updateWidget);

  const openOverlay = (widget: DesktopWidget) => {
    updateWidget(widget.id, { pinned: true, locked: true });
    onSelectWidget(widget.id);
    void nativeApi.openWidgetWindow(widget.id, widget.rect.x, widget.rect.y, widget.rect.width, widget.rect.height).catch(() => undefined);
  };

  const removeEverywhere = (id: string) => {
    removeWidget(id);
    if (selectedWidgetId === id) onSelectWidget(null);
    void nativeApi.closeWidgetWindow(id).catch(() => undefined);
  };

  return (
    <aside className="studio-panel flex h-full w-60 shrink-0 flex-col backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-black/8 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">Add Widget</div>
      </div>

      {/* Widget Library — compact grid */}
      <div className="px-3 pt-3 pb-2">
        <div className="space-y-1">
          {gallery.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                const widget = addWidget(item.type);
                onSelectWidget(widget.id);
              }}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/widget-kind", item.type);
                event.dataTransfer.effectAllowed = "copy";
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted transition hover:bg-black/5 hover:text-text"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/5 text-text/70 transition group-hover:bg-accent/10 group-hover:text-accent">
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              <Plus size={13} className="opacity-0 transition group-hover:opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Divider + Active Widgets */}
      {widgets.length > 0 && (
        <>
          <div className="mx-3 my-1 border-t border-black/8" />
          <div className="px-4 pb-1 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">Active</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div className="space-y-1">
              {widgets.map((widget) => {
                const selected = widget.id === selectedWidgetId;
                return (
                  <div
                    key={widget.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                      selected
                        ? "bg-accent/10 text-accent"
                        : "text-text/80 hover:bg-black/5"
                    }`}
                  >
                    <button
                      className="min-w-0 flex-1 truncate text-left font-medium"
                      onClick={() => onSelectWidget(widget.id)}
                    >
                      {widget.name}
                    </button>
                    {widget.pinned && <Pin size={11} className="shrink-0 text-accent/70" />}
                    {/* Quick-action icons appear on hover */}
                    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <IconButton label="Open overlay" onClick={() => openOverlay(widget)} icon={<Pin size={12} />} />
                      <IconButton label="Hide overlay" onClick={() => { updateWidget(widget.id, { pinned: false, locked: false }); void nativeApi.closeWidgetWindow(widget.id).catch(() => undefined); }} icon={<EyeOff size={12} />} />
                       <IconButton label="Duplicate" onClick={() => duplicateWidget(widget.id)} icon={<Copy size={12} />} />
                      {widget.type === "custom" && onOpenDeveloper && <IconButton label="Edit in builder" onClick={() => onOpenDeveloper(widget.id)} icon={<Code2 size={12} />} />}
                      <IconButton label="Delete" danger onClick={() => removeEverywhere(widget.id)} icon={<Trash2 size={12} />} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {widgets.length === 0 && (
        <div className="flex-1" />
      )}

      {/* Footer */}
      <div className="border-t border-black/8 px-3 py-2.5">
        <Button className="w-full justify-start text-xs" icon={<Settings size={14} />} onClick={onSettings}>
          Settings
        </Button>
      </div>
    </aside>
  );
}

function IconButton({ label, icon, danger, onClick }: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={label}
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`rounded-md p-1 hover:bg-black/10 ${danger ? "text-red-500" : "text-muted hover:text-text"}`}
    >
      {icon}
    </span>
  );
}
