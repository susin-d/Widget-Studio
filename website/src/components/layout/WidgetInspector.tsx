import { Code2, Copy, EyeOff, Lock, Pin, Trash2, Unlock } from "lucide-react";
import { nativeApi } from "../../lib/tauri";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget, ThemeMode, WidgetBackground } from "../../types/widget";
import { Button } from "../ui/Button";
import { openWidgetOverlay, closeWidgetOverlay, toggleWidgetLock, deleteWidget } from "../../lib/widgetActions";

interface WidgetInspectorProps {
  widget: DesktopWidget | null;
  onSelectWidget: (id: string | null) => void;
  onOpenDeveloper?: (id: string) => void;
}

export function WidgetInspector({ widget, onSelectWidget, onOpenDeveloper }: WidgetInspectorProps) {
  const duplicateWidget = useWidgetStore((state) => state.duplicateWidget);
  const removeWidget = useWidgetStore((state) => state.removeWidget);
  const updateRect = useWidgetStore((state) => state.updateRect);
  const updateSettings = useWidgetStore((state) => state.updateSettings);
  const updateWidget = useWidgetStore((state) => state.updateWidget);

  if (!widget) {
    return (
      <aside className="studio-panel w-80 p-5 backdrop-blur-xl">
        <div className="text-lg font-semibold">Inspector</div>
        <p className="mt-2 text-sm leading-6 text-muted">Select a widget on the canvas or from the sidebar to edit its layout, style, and overlay behavior.</p>
      </aside>
    );
  }

  const openOverlay = () => {
    void openWidgetOverlay(widget, updateWidget);
  };

  const hideOverlay = () => {
    void closeWidgetOverlay(widget, updateWidget);
  };

  const removeEverywhere = () => {
    void deleteWidget(widget, removeWidget);
    onSelectWidget(null);
  };

  const toggleLock = () => {
    void toggleWidgetLock(widget, updateWidget);
  };

  return (
    <aside className="studio-panel flex h-full w-80 shrink-0 flex-col p-4 backdrop-blur-xl">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Inspector</div>
          <input
            value={widget.name}
            onChange={(event) => updateWidget(widget.id, { name: event.target.value })}
            className="mt-2 w-full bg-transparent text-xl font-semibold outline-none"
          />
          <div className="mt-1 text-xs text-muted">{widget.type} · {widget.pinned ? "Desktop overlay" : "Canvas only"}</div>
        </div>

        <Section title="Actions">
          <div className="grid grid-cols-2 gap-2">
            <Button icon={<Pin size={14} />} onClick={openOverlay}>Open</Button>
            <Button icon={<EyeOff size={14} />} onClick={hideOverlay}>Hide</Button>
            <Button icon={widget.locked || widget.pinned ? <Unlock size={14} /> : <Lock size={14} />} onClick={toggleLock}>
              {widget.pinned ? "Unpin & unlock" : widget.locked ? "Unlock" : "Lock"}
            </Button>
            <Button icon={<Copy size={14} />} onClick={() => duplicateWidget(widget.id)}>Duplicate</Button>
          </div>
          <Button className="mt-2 w-full" variant="danger" icon={<Trash2 size={14} />} onClick={removeEverywhere}>Delete widget</Button>
        </Section>

        <Section title="Appearance">
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span>Widget color</span>
            <div className="flex items-center gap-2">
              <input aria-label="Widget color" type="color" value={widget.settings.color ?? "#8b5cf6"} onChange={(event) => updateSettings(widget.id, { color: event.target.value })} className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
              {widget.settings.color && <Button className="min-h-8 px-2 text-xs" onClick={() => updateSettings(widget.id, { color: undefined })}>Auto</Button>}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span>Text color</span>
            <div className="flex items-center gap-2">
              <input aria-label="Text color" type="color" value={widget.settings.textColor ?? "#ffffff"} onChange={(event) => updateSettings(widget.id, { textColor: event.target.value })} className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
              {widget.settings.textColor && <Button className="min-h-8 px-2 text-xs" onClick={() => updateSettings(widget.id, { textColor: undefined })}>Auto</Button>}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span>Bar / Accent color</span>
            <div className="flex items-center gap-2">
              <input aria-label="Bar color" type="color" value={widget.settings.barColor ?? "#ff4f87"} onChange={(event) => updateSettings(widget.id, { barColor: event.target.value })} className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
              {widget.settings.barColor && <Button className="min-h-8 px-2 text-xs" onClick={() => updateSettings(widget.id, { barColor: undefined })}>Auto</Button>}
            </div>
          </div>
          <SelectRow label="Theme" value={widget.settings.theme} options={["system", "light", "dark"]} onChange={(value) => updateSettings(widget.id, { theme: value as ThemeMode })} />
          <SelectRow label="Background" value={widget.settings.background} options={["transparent", "glass", "solid"]} onChange={(value) => updateSettings(widget.id, { background: value as WidgetBackground })} />
          <RangeRow label="Font" min={12} max={28} value={widget.settings.fontSize} onChange={(value) => updateSettings(widget.id, { fontSize: value })} />
          <RangeRow label="Radius" min={0} max={32} value={widget.settings.radius} onChange={(value) => updateSettings(widget.id, { radius: value })} />
          <RangeRow label="Opacity" min={20} max={100} value={Math.round(widget.settings.opacity * 100)} suffix="%" onChange={(value) => updateSettings(widget.id, { opacity: value / 100 })} />
        </Section>

        <Section title="Layout">
          <div className="grid grid-cols-2 gap-2">
            <NumberRow label="X" value={widget.rect.x} onChange={(value) => updateRect(widget.id, { x: value })} />
            <NumberRow label="Y" value={widget.rect.y} onChange={(value) => updateRect(widget.id, { y: value })} />
            <NumberRow label="Width" min={80} value={widget.rect.width} onChange={(value) => updateRect(widget.id, { width: value })} />
            <NumberRow label="Height" min={40} value={widget.rect.height} onChange={(value) => updateRect(widget.id, { height: value })} />
          </div>
          <div className="grid grid-cols-2 gap-2"><Button onClick={()=>updateWidget(widget.id,{zIndex:Math.max(1,(widget.zIndex??1)-1)})}>Send backward</Button><Button onClick={()=>updateWidget(widget.id,{zIndex:(widget.zIndex??1)+1})}>Bring forward</Button></div>
        </Section>

        <Section title="Widget">
          <WidgetSpecific widget={widget} onOpenDeveloper={onOpenDeveloper} />
        </Section>
      </div>
    </aside>
  );
}

function WidgetSpecific({ widget, onOpenDeveloper }: { widget: DesktopWidget; onOpenDeveloper?: (id: string) => void }) {
  const updateWidget=useWidgetStore.getState().updateWidget;
  if (widget.type === "custom") return <div className="space-y-3"><p className="text-sm text-muted">This widget runs from your saved HTML, CSS, and JavaScript source inside the sandbox.</p>{onOpenDeveloper && <Button className="w-full" icon={<Code2 size={14}/>} onClick={() => onOpenDeveloper(widget.id)}>Edit in builder</Button>}<Button className="w-full" onClick={() => updateWidget(widget.id, { data: { ...widget.data, permissions: {} } })}>Reset permissions</Button></div>;
  if (widget.type === "weather") return <div className="space-y-3"><label className="block text-xs text-muted">Location<input className="mt-1 w-full rounded-md border border-black/10 bg-white/70 p-2 text-text" value={String(widget.data?.location??"New Delhi")} onChange={e=>updateWidget(widget.id,{data:{...widget.data,location:e.target.value}})}/></label><SelectRow label="Units" value={String(widget.data?.units??"celsius")} options={["celsius","fahrenheit"]} onChange={units=>updateWidget(widget.id,{data:{...widget.data,units}})}/><NumberRow label="Refresh minutes" min={5} value={widget.settings.refreshInterval} onChange={refreshInterval=>useWidgetStore.getState().updateSettings(widget.id,{refreshInterval})}/></div>;
  if (widget.type === "todo") return <p className="text-sm text-muted">Todo items are edited directly inside the widget.</p>;
  if (widget.type === "notes") return <p className="text-sm text-muted">Notes are edited directly inside the widget.</p>;
  if (widget.type === "links") return <p className="text-sm text-muted">Quick links are edited directly inside the widget.</p>;
  return <p className="text-sm text-muted">No extra controls for this widget.</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 border-t border-black/10 pt-4 dark:border-white/10">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-muted">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-text dark:border-white/10 dark:bg-black/20">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function RangeRow({ label, min, max, value, suffix = "", onChange }: { label: string; min: number; max: number; value: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm text-muted">
      <span className="flex justify-between"><span>{label}</span><span>{value}{suffix}</span></span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full accent-[rgb(var(--accent))]" />
    </label>
  );
}

function NumberRow({ label, value, min, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs text-muted">
      <span>{label}</span>
      <input type="number" min={min} value={Math.round(value)} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-text dark:border-white/10 dark:bg-black/20" />
    </label>
  );
}
