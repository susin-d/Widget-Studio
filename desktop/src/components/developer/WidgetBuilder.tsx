import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Blocks, Code2, ExternalLink, Image, Link2, Minus, Play, Plus, Save, Sparkles, Trash2, Type, Rows3, SquareStack } from "lucide-react";
import type { DesktopWidget } from "../../types/widget";
import type { CustomWidgetDraft, CustomWidgetPermission, VisualBlock, VisualBlockType, VisualContainerBlock, VisualWidgetDocument } from "../../types/customWidget";
import { CUSTOM_WIDGET_PERMISSIONS, createDefaultVisualDocument, createVisualBlock, customWidgetDataFromDraft, draftFromWidget, findVisualBlock, insertVisualBlock, moveVisualBlock, removeVisualBlock, updateVisualBlock } from "../../types/customWidget";
import { renderVisualDocument, validateCustomWidgetSource } from "../../lib/customWidget";
import { CustomWidgetRuntime } from "../widgets/CustomWidgetRuntime";

type BuilderTab = "guide" | "visual" | "code";

interface WidgetBuilderProps {
  editingWidget: DesktopWidget | null;
  onPublish: (draft: CustomWidgetDraft, existingWidget: DesktopWidget | null) => void;
  onCancel: () => void;
}

export function WidgetBuilder({ editingWidget, onPublish, onCancel }: WidgetBuilderProps) {
  const draftKey = `widget-studio-custom-draft:${editingWidget?.id ?? "new"}`;
  const [draft, setDraft] = useState<CustomWidgetDraft>(() => loadDraft(draftKey, editingWidget));
  const [tab, setTab] = useState<BuilderTab>("guide");
  const [selectedBlockId, setSelectedBlockId] = useState("root");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDraft(loadDraft(draftKey, editingWidget));
    setSelectedBlockId("root");
  }, [draftKey, editingWidget]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* local draft recovery is best effort */ }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, draftKey]);

  const effectiveSource = useMemo(() => draft.mode === "visual" ? renderVisualDocument(draft.visual) : draft.source, [draft.mode, draft.source, draft.visual]);
  const validation = useMemo(() => validateCustomWidgetSource(effectiveSource), [effectiveSource]);
  const selectedBlock = findVisualBlock(draft.visual, selectedBlockId);

  const updateVisual = (visual: VisualWidgetDocument) => setDraft((current) => ({ ...current, mode: "visual", visual, source: renderVisualDocument(visual) }));
  const updateSelected = (patch: Record<string, unknown>) => {
    if (!selectedBlock || selectedBlock.id === "root") return;
    updateVisual(updateVisualBlock(draft.visual, selectedBlock.id, patch as Partial<VisualBlock>));
  };
  const addBlock = (type: VisualBlockType) => {
    const block = createVisualBlock(type);
    const parent = selectedBlock?.type === "container" || selectedBlock?.type === "row" ? selectedBlock.id : "root";
    updateVisual(insertVisualBlock(draft.visual, parent, block));
    setSelectedBlockId(block.id);
  };
  const deleteSelected = () => {
    if (selectedBlockId === "root") return;
    updateVisual(removeVisualBlock(draft.visual, selectedBlockId));
    setSelectedBlockId("root");
  };
  const moveSelected = (direction: -1 | 1) => updateVisual(moveVisualBlock(draft.visual, selectedBlockId, direction));
  const enterCodeMode = () => { setTab("code"); setDraft((current) => ({ ...current, mode: "code", source: renderVisualDocument(current.visual) })); };
  const enterVisualMode = () => {
    if (draft.mode === "code" && !window.confirm("Switching to visual mode will discard code-only changes and restore the last visual layout. Continue?")) return;
    setTab("visual");
    setDraft((current) => ({ ...current, mode: "visual", source: renderVisualDocument(current.visual) }));
  };
  const publish = () => {
    if (!draft.name.trim()) { setNotice("Give your widget a name before publishing."); return; }
    if (validation.errors.length) { setNotice("Fix the validation errors before publishing."); return; }
    const published = { ...draft, name: draft.name.trim(), source: effectiveSource };
    localStorage.removeItem(draftKey);
    onPublish(published, editingWidget);
  };

  return <section className="manager-page">
    <header className="mb-4 flex items-start gap-4">
      <div><h1 className="text-2xl font-semibold">{editingWidget ? "Edit custom widget" : "Create a custom widget"}</h1><p className="mt-1 text-sm text-muted">Build with safe blocks, refine the code, preview it, and publish it to your workspace.</p></div>
      <div className="ml-auto flex items-center gap-2"><button className="secondary-action" onClick={onCancel}>Cancel</button><button className="secondary-action" onClick={() => setTab(draft.mode === "code" ? "code" : "visual")}><Play size={14}/> Preview</button><button className="primary-action" onClick={publish}><Save size={14}/> Publish widget</button></div>
    </header>
    <div className="mb-4 flex items-center gap-1 rounded-xl border border-black/8 bg-black/[.03] p-1 dark:border-white/8 dark:bg-white/[.04]">
      {([ ["guide", "Guide", <Sparkles size={14}/>], ["visual", "Visual builder", <Blocks size={14}/>], ["code", "Code", <Code2 size={14}/>] ] as const).map(([id, label, icon]) => <button key={id} onClick={() => id === "visual" ? enterVisualMode() : id === "code" ? enterCodeMode() : setTab("guide")} className={`builder-tab ${tab === id ? "active" : ""}`}>{icon}{label}{id === "code" && draft.mode === "code" ? <span className="builder-dot"/> : null}</button>)}
    </div>
    <label className="developer-field mb-4 max-w-xl"><span>Widget name</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="My custom widget" /></label>
    {tab === "guide" && <GuidePanel onStartVisual={() => { setTab("visual"); enterVisualMode(); }} onStartCode={() => { setTab("code"); enterCodeMode(); }} />}
    {tab === "visual" && <div className="grid min-h-[530px] grid-cols-[210px_minmax(0,1fr)_270px] gap-3"><BlockLibrary onAdd={addBlock} document={draft.visual} selectedBlockId={selectedBlockId} onSelect={setSelectedBlockId} onMove={moveSelected} onDelete={deleteSelected} /><PreviewPanel name={draft.name} source={effectiveSource} permissions={draft.permissions} onPermissionsChange={(permissions) => setDraft((current) => ({ ...current, permissions }))} validation={validation} /><BlockInspector block={selectedBlock} onUpdate={updateSelected} /></div>}
    {tab === "code" && <div className="grid min-h-[530px] grid-cols-[minmax(0,1fr)_360px] gap-3"><CodeEditor source={draft.source} onChange={(source) => setDraft((current) => ({ ...current, mode: "code", source }))} /><PreviewPanel name={draft.name} source={effectiveSource} permissions={draft.permissions} onPermissionsChange={(permissions) => setDraft((current) => ({ ...current, permissions }))} validation={validation} /></div>}
    {notice && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">{notice}</p>}
  </section>;
}

function loadDraft(key: string, editingWidget: DesktopWidget | null): CustomWidgetDraft {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomWidgetDraft;
      if (parsed?.name && parsed?.source && parsed?.visual) return parsed;
    }
  } catch { /* use a clean draft */ }
  if (editingWidget) return draftFromWidget(editingWidget);
  const visual = createDefaultVisualDocument();
  return { name: "My Custom Widget", mode: "visual", visual, source: renderVisualDocument(visual), permissions: {} };
}

function GuidePanel({ onStartVisual, onStartCode }: { onStartVisual: () => void; onStartCode: () => void }) {
  return <div className="grid max-w-5xl gap-4 md:grid-cols-[1.3fr_1fr]">
    <div className="content-panel"><div className="mb-5 flex items-center gap-3"><div className="builder-guide-icon"><Sparkles size={18}/></div><div><h2 className="text-lg font-semibold">Build your first widget</h2><p className="text-sm text-muted">Start visually, then add code whenever you need more control.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{[["1", "Choose a starting point", "Use the visual builder for a safe layout or open the code editor for full HTML, CSS, and JavaScript control."], ["2", "Compose the experience", "Add headings, text, images, links, buttons, rows, containers, and spacing. Select a block to edit its properties."], ["3", "Preview and test", "The preview runs in an isolated iframe. Try interactions and fix validation or runtime errors before publishing."], ["4", "Publish and pin", "Publishing adds the widget to your workspace. On desktop, select it and open it as a transparent desktop overlay."]].map(([number, title, text]) => <div key={number} className="rounded-xl border border-black/8 bg-black/[.025] p-3 dark:border-white/8 dark:bg-white/[.035]"><div className="builder-step-number">{number}</div><b className="mt-2 block text-sm">{title}</b><p className="mt-1 text-xs leading-5 text-muted">{text}</p></div>)}</div><div className="mt-5 flex gap-2"><button className="primary-action" onClick={onStartVisual}><Blocks size={14}/> Start visually</button><button className="secondary-action" onClick={onStartCode}><Code2 size={14}/> Start with code</button></div></div>
    <div className="content-panel"><h3 className="font-semibold">Protected APIs</h3><p className="mt-1 text-xs leading-5 text-muted">Custom code cannot call Tauri or the parent app directly. It must request one of these capabilities, and the user approves each capability the first time it is used.</p><div className="mt-4 space-y-2">{CUSTOM_WIDGET_PERMISSIONS.map((permission) => <div className="flex items-center gap-2 rounded-lg bg-black/[.04] px-3 py-2 text-xs dark:bg-white/[.05]" key={permission}><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/><span>{permission === "openExternal" ? "Open external HTTP(S) links" : permission === "network" ? "HTTPS network requests" : permission === "clipboard" ? "Copy text to clipboard" : "Desktop notifications"}</span></div>)}</div><pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">{`WidgetStudio.request("notifications", {\n  title: "Hello",\n  body: "From my widget"\n});`}</pre></div>
  </div>;
}

function BlockLibrary({ onAdd, document, selectedBlockId, onSelect, onMove, onDelete }: { onAdd: (type: VisualBlockType) => void; document: VisualWidgetDocument; selectedBlockId: string; onSelect: (id: string) => void; onMove: (direction: -1 | 1) => void; onDelete: () => void }) {
  const items: Array<[VisualBlockType, string, React.ReactNode]> = [["container", "Container", <SquareStack size={14}/>], ["row", "Row", <Rows3 size={14}/>], ["heading", "Heading", <Type size={14}/>], ["text", "Text", <Type size={14}/>], ["button", "Button", <Play size={14}/>], ["link", "Link", <Link2 size={14}/>], ["image", "Image", <Image size={14}/>], ["spacer", "Spacer", <Minus size={14}/>]];
  return <aside className="builder-panel flex min-h-0 flex-col"><div className="builder-panel-title">Add block</div><div className="grid grid-cols-2 gap-1.5 p-2">{items.map(([type, label, icon]) => <button key={type} title={`Add ${label}`} onClick={() => onAdd(type)} className="builder-block-add">{icon}<span>{label}</span></button>)}</div><div className="builder-panel-title border-t">Structure</div><div className="min-h-0 flex-1 overflow-y-auto p-2"><BlockTree block={document.root} selectedBlockId={selectedBlockId} onSelect={onSelect} depth={0}/></div>{selectedBlockId !== "root" && <div className="flex gap-1 border-t p-2"><button className="builder-icon-button" title="Move up" onClick={() => onMove(-1)}><ArrowUp size={13}/></button><button className="builder-icon-button" title="Move down" onClick={() => onMove(1)}><ArrowDown size={13}/></button><button className="builder-icon-button danger ml-auto" title="Delete block" onClick={onDelete}><Trash2 size={13}/></button></div>}</aside>;
}

function BlockTree({ block, selectedBlockId, onSelect, depth }: { block: VisualBlock; selectedBlockId: string; onSelect: (id: string) => void; depth: number }) {
  const isContainer = block.type === "container" || block.type === "row";
  return <div><button onClick={() => onSelect(block.id)} className={`builder-tree-item ${block.id === selectedBlockId ? "selected" : ""}`} style={{ paddingLeft: `${8 + depth * 12}px` }}>{block.id === "root" ? <SquareStack size={12}/> : block.type === "image" ? <Image size={12}/> : block.type === "link" ? <Link2 size={12}/> : <Type size={12}/>}<span className="truncate">{block.id === "root" ? "Root container" : blockLabel(block)}</span></button>{isContainer && block.children.map((child) => <BlockTree key={child.id} block={child} selectedBlockId={selectedBlockId} onSelect={onSelect} depth={depth + 1}/>)}</div>;
}

function PreviewPanel({ name, source, permissions, onPermissionsChange, validation }: { name: string; source: { html: string; css: string; js: string }; permissions: Record<string, boolean>; onPermissionsChange: (permissions: Record<string, boolean>) => void; validation: { errors: string[]; warnings: string[] } }) {
  return <section className="builder-panel flex min-h-0 flex-col"><div className="flex items-center border-b px-3 py-2"><div><b className="text-xs">Live preview</b><span className="ml-2 text-[10px] text-muted">300 × 220</span></div><span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Sandboxed</span></div><div className="flex min-h-[360px] flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(102,94,232,.13),_transparent_40%),rgba(0,0,0,.025)] p-6 dark:bg-[radial-gradient(circle_at_top_right,_rgba(102,94,232,.2),_transparent_40%),rgba(255,255,255,.02)]"><div className="h-[220px] w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-xl dark:border-white/10 dark:bg-slate-900/80"><CustomWidgetRuntime name={name || "Custom widget"} source={source} permissions={permissions} onPermissionsChange={onPermissionsChange}/></div></div><div className="border-t p-3">{validation.errors.map((error) => <p className="text-[11px] text-red-600" key={error}>● {error}</p>)}{validation.warnings.map((warning) => <p className="text-[11px] text-amber-700" key={warning}>● {warning}</p>)}{!validation.errors.length && !validation.warnings.length && <p className="text-[11px] text-muted">Interact with the preview to test buttons and links.</p>}</div></section>;
}

function BlockInspector({ block, onUpdate }: { block: VisualBlock | null; onUpdate: (patch: Record<string, unknown>) => void }) {
  if (!block || block.id === "root") return <aside className="builder-panel p-4"><b className="text-xs uppercase tracking-wide text-muted">Block properties</b><p className="mt-3 text-xs leading-5 text-muted">Select a block to edit its content, style, and behavior. Select a container before adding a block to place it inside that container.</p></aside>;
  const style = "style" in block ? block.style : {};
  const updateStyle = (patch: Record<string, unknown>) => onUpdate({ style: { ...style, ...patch } });
  return <aside className="builder-panel min-h-0 overflow-y-auto p-4"><div className="mb-4 flex items-center gap-2"><b className="text-xs uppercase tracking-wide text-muted">{blockLabel(block)}</b><span className="ml-auto rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-muted">{block.type}</span></div>{(block.type === "container" || block.type === "row") && <><Field label="Direction"><select value={block.type} onChange={(event) => onUpdate({ type: event.target.value })}><option value="container">Column</option><option value="row">Row</option></select></Field><NumberField label="Gap" value={block.gap} onChange={(value) => onUpdate({ gap: value })}/><NumberField label="Padding" value={block.padding} onChange={(value) => onUpdate({ padding: value })}/><ColorField label="Background" value={block.style.backgroundColor} onChange={(value) => updateStyle({ backgroundColor: value })}/></>}{block.type === "heading" && <><TextField label="Text" value={block.text} onChange={(value) => onUpdate({ text: value })}/><Field label="Level"><select value={block.level} onChange={(event) => onUpdate({ level: Number(event.target.value) })}><option value={1}>Heading 1</option><option value={2}>Heading 2</option><option value={3}>Heading 3</option></select></Field><NumberField label="Font size" value={block.style.fontSize ?? 22} onChange={(value) => updateStyle({ fontSize: value })}/><ColorField label="Text color" value={block.style.color} onChange={(value) => updateStyle({ color: value })}/></>}{block.type === "text" && <><TextAreaField label="Text" value={block.text} onChange={(value) => onUpdate({ text: value })}/><NumberField label="Font size" value={block.style.fontSize ?? 14} onChange={(value) => updateStyle({ fontSize: value })}/><ColorField label="Text color" value={block.style.color} onChange={(value) => updateStyle({ color: value })}/></>}{block.type === "button" && <><TextField label="Label" value={block.label} onChange={(value) => onUpdate({ label: value })}/><Field label="Action"><select value={block.action} onChange={(event) => onUpdate({ action: event.target.value })}><option value="none">No action</option><option value="notifications">Notification</option><option value="clipboard">Copy to clipboard</option><option value="openExternal">Open external link</option></select></Field><TextField label="Action value" value={block.value} onChange={(value) => onUpdate({ value })}/><ColorField label="Button color" value={block.style.backgroundColor} onChange={(value) => updateStyle({ backgroundColor: value })}/><ColorField label="Text color" value={block.style.color} onChange={(value) => updateStyle({ color: value })}/></>}{block.type === "link" && <><TextField label="Label" value={block.label} onChange={(value) => onUpdate({ label: value })}/><TextField label="HTTP(S) URL" value={block.url} onChange={(value) => onUpdate({ url: value })}/><ColorField label="Link color" value={block.style.color} onChange={(value) => updateStyle({ color: value })}/></>}{block.type === "image" && <><TextField label="HTTP(S) image URL" value={block.src} onChange={(value) => onUpdate({ src: value })}/><TextField label="Alt text" value={block.alt} onChange={(value) => onUpdate({ alt: value })}/><NumberField label="Width" value={block.width} onChange={(value) => onUpdate({ width: value })}/><NumberField label="Height" value={block.height} onChange={(value) => onUpdate({ height: value })}/></>}{block.type === "spacer" && <NumberField label="Height" value={block.size} onChange={(value) => onUpdate({ size: value })}/>}</aside>;
}

function CodeEditor({ source, onChange }: { source: { html: string; css: string; js: string }; onChange: (source: { html: string; css: string; js: string }) => void }) { return <section className="builder-panel min-h-0 overflow-y-auto p-4"><div className="mb-3 flex items-center gap-2"><Code2 size={15}/><b className="text-sm">Source editor</b><span className="ml-auto text-[10px] text-muted">Code mode is authoritative</span></div><CodeField label="HTML" value={source.html} onChange={(html) => onChange({ ...source, html })}/><CodeField label="CSS" value={source.css} onChange={(css) => onChange({ ...source, css })}/><CodeField label="JavaScript" value={source.js} onChange={(js) => onChange({ ...source, js })}/><p className="mt-2 text-[10px] leading-4 text-muted">Use <code>WidgetStudio.request(permission, payload)</code> for protected APIs. Raw code is executed only inside the sandbox.</p></section>; }
function CodeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="developer-field"><span>{label}</span><textarea rows={label === "JavaScript" ? 9 : 7} value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false}/></label>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="developer-field"><span>{label}</span>{children}</label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><input value={value} onChange={(event) => onChange(event.target.value)}/></Field>; }
function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)}/></Field>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <Field label={label}><input type="number" min={0} max={1000} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)}/></Field>; }
function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) { return <Field label={label}><div className="flex gap-2"><input type="color" value={value?.startsWith("#") ? value : "#665ee8"} onChange={(event) => onChange(event.target.value)} className="h-9 w-12 cursor-pointer p-0"/><input value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="#665ee8"/></div></Field>; }
function blockLabel(block: VisualBlock): string { if (block.type === "heading") return block.text || "Heading"; if (block.type === "text") return block.text || "Text"; if (block.type === "button") return block.label || "Button"; if (block.type === "link") return block.label || "Link"; if (block.type === "image") return "Image"; if (block.type === "spacer") return "Spacer"; return block.type === "row" ? "Row" : "Container"; }
