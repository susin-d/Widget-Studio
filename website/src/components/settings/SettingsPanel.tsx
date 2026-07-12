import type { ReactNode } from "react";
import { Check, Palette, Sparkles } from "lucide-react";
import type { ColorTheme } from "../../types/widget";
import { useSettingsStore } from "../../store/settingsStore";
import { Button } from "../ui/Button";
import { useWidgetStore } from "../../store/widgetStore";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSetting } = useSettingsStore();
  const setWidgets = useWidgetStore((state) => state.setWidgets);
  const widgets = useWidgetStore((state) => state.widgets);
  return (
    <aside className="w-96 border-l border-black/10 bg-panel/90 p-5 backdrop-blur-xl dark:border-white/10">
      <div className="mb-5 flex items-center justify-between">
        <div><div className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={18} className="text-accent" /> Make it yours</div><p className="mt-1 text-xs text-muted">Pick a mood for your desktop.</p></div>
        <Button onClick={onClose}>Close</Button>
      </div>
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Palette size={16} /> Color theme</div>
          <div className="grid grid-cols-2 gap-2">
            {colorThemes.map((theme) => <ThemeCard key={theme.id} theme={theme} selected={settings.colorTheme === theme.id} onClick={() => { updateSetting("colorTheme", theme.id); updateSetting("accentColor", theme.accent); }} />)}
          </div>
        </div>
        <Select label="Brightness" value={settings.theme} onChange={(v) => updateSetting("theme", v as typeof settings.theme)} options={["system", "light", "dark"]} />
        <Select label="Widget background" value={settings.widgetBackground} onChange={(v) => {
          const background = v as typeof settings.widgetBackground;
          updateSetting("widgetBackground", background);
          setWidgets(widgets.map((widget) => ({ ...widget, settings: { ...widget.settings, background } })));
        }} options={["glass", "solid", "transparent"]} />
        <Field label="Accent color"><input type="color" value={settings.accentColor} onChange={(e) => updateSetting("accentColor", e.target.value)} className="h-9 w-14 rounded border-0 bg-transparent" /></Field>
        <Slider label="Blur" value={settings.blurIntensity} min={0} max={32} onChange={(v) => updateSetting("blurIntensity", v)} />
        <Slider label="Shadow" value={settings.shadowIntensity} min={0} max={0.35} step={0.01} onChange={(v) => updateSetting("shadowIntensity", v)} />
        <Slider label="Corner radius" value={settings.cornerRadius} min={4} max={28} onChange={(v) => {
          updateSetting("cornerRadius", v);
          setWidgets(widgets.map((widget) => ({ ...widget, settings: { ...widget.settings, radius: v } })));
        }} />
        <Toggle label="Launch on startup" checked={settings.launchOnStartup} onChange={(v) => updateSetting("launchOnStartup", v)} />
        <Toggle label="Restore widgets on launch" checked={settings.restoreWidgetsOnLaunch} onChange={(v) => updateSetting("restoreWidgetsOnLaunch", v)} />
        <Toggle label="Snap to grid" checked={settings.snapToGrid} onChange={(v) => updateSetting("snapToGrid", v)} />
        <Toggle label="Lock widget positions" checked={settings.lockPositions} onChange={(v) => updateSetting("lockPositions", v)} />
      </div>
    </aside>
  );
}

const colorThemes: Array<{ id: ColorTheme; name: string; emoji: string; accent: string; colors: string[] }> = [
  { id: "berry-pop", name: "Berry Pop", emoji: "🍓", accent: "#ff4f87", colors: ["#ff4f87", "#8b5cf6", "#ffd166"] },
  { id: "citrus-splash", name: "Citrus Splash", emoji: "🍊", accent: "#f97316", colors: ["#f97316", "#facc15", "#22c55e"] },
  { id: "ocean-candy", name: "Ocean Candy", emoji: "🐬", accent: "#06b6d4", colors: ["#06b6d4", "#3b82f6", "#fb7185"] },
  { id: "lavender-dream", name: "Lavender Dream", emoji: "🦄", accent: "#a855f7", colors: ["#a855f7", "#ec4899", "#818cf8"] }
  ,{ id: "mint-sorbet", name: "Mint Sorbet", emoji: "🍨", accent: "#10b981", colors: ["#10b981", "#5eead4", "#fda4af"] }
  ,{ id: "midnight-neon", name: "Midnight Neon", emoji: "🌙", accent: "#8b5cf6", colors: ["#8b5cf6", "#22d3ee", "#f472b6"] }
];

function ThemeCard({ theme, selected, onClick }: { theme: typeof colorThemes[number]; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`relative rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-widget ${selected ? "border-accent bg-accent/10 ring-2 ring-accent/20" : "border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]"}`}>
    <div className="mb-3 flex items-center justify-between"><span className="text-xl">{theme.emoji}</span>{selected && <span className="rounded-full bg-accent p-1 text-white"><Check size={11} /></span>}</div>
    <div className="text-xs font-semibold">{theme.name}</div>
    <div className="mt-2 flex gap-1">{theme.colors.map((color) => <span key={color} className="h-2 flex-1 rounded-full" style={{ background: color }} />)}</div>
  </button>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex items-center justify-between gap-4 text-sm text-muted"><span>{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <Field label={label}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--accent))]" /></Field>;
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <Field label={`${label} ${value}`}><input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-36 accent-[rgb(var(--accent))]" /></Field>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-text dark:border-white/10 dark:bg-black/20">{options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}
