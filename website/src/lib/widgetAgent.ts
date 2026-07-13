import type { DesktopWidget, WidgetKind } from "../types/widget";
import { createWidget } from "../store/widgetStore";

export interface WidgetAgentResult { widgets: DesktopWidget[]; message: string; }
const aliases: Record<string, WidgetKind> = { clock: "clock", weather: "weather", todo: "todo", task: "todo", notes: "notes", note: "notes", links: "links", link: "links", calendar: "calendar", mindmap: "mindmap", pomodoro: "pomodoro", timer: "pomodoro", worldclock: "worldclock", stickynotes: "stickynotes", sticky: "stickynotes", calculator: "calculator", chatbot: "chatbot", custom: "custom", system: "system" };
const find = (widgets: DesktopWidget[], query: string) => { const q = query.trim().toLowerCase(); return widgets.find((w) => w.name.toLowerCase() === q) ?? widgets.find((w) => w.type === aliases[q]) ?? widgets.find((w) => w.name.toLowerCase().includes(q)); };
const parts = (value: string) => value.split(/\s*\|\s*/, 2).map((x) => x.trim());

export function executeWidgetCommand(command: string, input: DesktopWidget[]): WidgetAgentResult {
  const value = command.trim(), lower = value.toLowerCase(), widgets = input.map((w) => ({ ...w, data: w.data ? { ...w.data } : {} }));
  if (!value) return { widgets: input, message: "Enter a widget command." };
  if (/^(list|show) (all )?widgets$/.test(lower) || lower === "inspect workspace") return { widgets: input, message: widgets.length ? widgets.map((w) => `${w.name} (${w.type}${w.hidden ? ", hidden" : ""})`).join(" · ") : "No widgets are installed." };
  const create = lower.match(/^(?:create|add|install) (?:a )?([a-z]+)(?: widget)?$/);
  if (create && aliases[create[1]]) { const made = createWidget(aliases[create[1]], widgets.length); return { widgets: [...widgets, made], message: `Created ${made.name}.` }; }
  const remove = value.match(/^(?:delete|remove) widget\s*:?\s*(.+)$/i);
  if (remove) { const target = find(widgets, remove[1]); return target ? { widgets: widgets.filter((w) => w.id !== target.id), message: `Removed ${target.name}.` } : { widgets: input, message: `I couldn't find widget “${remove[1]}”.` }; }
  const state = lower.match(/^(show|hide|pin|unpin|lock|unlock) (all )?widgets?$/);
  const targetState = lower.match(/^(show|hide|pin|unpin|lock|unlock) widget\s+(.+)$/);
  if (state || targetState) {
    const action = (state ?? targetState)![1], target = targetState ? find(widgets, targetState[2]) : undefined;
    if (targetState && !target) return { widgets: input, message: `I couldn't find widget “${targetState[2]}”.` };
    const next = widgets.map((w) => !target || w.id === target.id ? { ...w, ...(action === "show" ? { hidden: false } : {}), ...(action === "hide" ? { hidden: true } : {}), ...(action === "pin" ? { pinned: true, locked: true } : {}), ...(action === "unpin" ? { pinned: false, locked: false } : {}), ...(action === "lock" ? { locked: true } : {}), ...(action === "unlock" ? { locked: false } : {}) } : w);
    return { widgets: next, message: `${action[0].toUpperCase()}${action.slice(1)}d ${target?.name ?? `${widgets.length} widgets`}.` };
  }
  const task = value.match(/^(?:add|create) (?:todo|task):\s*(.+)$/i);
  if (task) { let todo: DesktopWidget | undefined = widgets.find((w) => w.type === "todo"), next: DesktopWidget[] = widgets; if (!todo) { todo = createWidget("todo", widgets.length); next = [...widgets, todo]; } return { widgets: next.map((w) => w.id === todo!.id ? { ...w, data: { ...w.data, items: [...(Array.isArray(w.data?.items) ? w.data.items : []), { id: crypto.randomUUID(), text: task[1].trim(), done: false }] } } : w), message: `Added task “${task[1].trim()}”.` }; }
  if (/^(complete|finish|check off) (all )?(todo|tasks?)$/i.test(value)) return { widgets: widgets.map((w) => w.type === "todo" ? { ...w, data: { ...w.data, items: (Array.isArray(w.data?.items) ? w.data.items : []).map((item: any) => ({ ...item, done: true })) } } : w), message: "Completed every Todo task." };
  const note = value.match(/^set (?:the )?notes?(?: to)?:\s*(.+)$/i), weather = value.match(/^(?:set|change) (?:weather )?location(?: to)?:\s*(.+)$/i), link = value.match(/^add link:\s*(.+)$/i), sticky = value.match(/^add sticky(?: note)?:\s*(.+)$/i);
  if (note || weather || link || sticky) { const type = note ? "notes" : weather ? "weather" : link ? "links" : "stickynotes", target = widgets.find((w) => w.type === type); if (!target) return { widgets: input, message: `No ${type} widget is installed.` }; const data = note ? { ...target.data, text: note[1].trim() } : weather ? { ...target.data, location: weather[1].trim() } : link ? { ...target.data, links: [...(Array.isArray(target.data?.links) ? target.data.links : []), (() => { const [label, url] = parts(link![1]); return { label, url }; })()] } : { ...target.data, notes: [{ id: crypto.randomUUID(), title: parts(sticky![1])[0] || "Untitled", content: parts(sticky![1])[1] || "", color: "bg-amber-100 dark:bg-amber-950/40 border-amber-300" }, ...(Array.isArray(target.data?.notes) ? target.data.notes : [])] }; return { widgets: widgets.map((w) => w.id === target.id ? { ...w, data } : w), message: `Updated ${target.name}.` }; }
  const event = value.match(/^add event:\s*(.+)$/i); if (event) { const [date, text] = parts(event[1]), target = widgets.find((w) => w.type === "calendar"); if (!target || !date || !text) return { widgets: input, message: "Use: add event: YYYY-MM-DD | Event text" }; const events = (target.data?.events as Record<string, string[]> | undefined) ?? {}; return { widgets: widgets.map((w) => w.id === target.id ? { ...w, data: { ...w.data, events: { ...events, [date]: [...(events[date] ?? []), text] } } } : w), message: `Added calendar event “${text}” on ${date}.` }; }
  const mindmap = value.match(/^set mindmap(?: root)?(?: to)?:\s*(.+)$/i); if (mindmap) { const target = widgets.find((w) => w.type === "mindmap"); if (!target) return { widgets: input, message: "No Mindmap widget is installed." }; const root = (target.data?.root as Record<string, unknown> | undefined) ?? { id: "root", children: [] }; return { widgets: widgets.map((w) => w.id === target.id ? { ...w, data: { ...w.data, root: { ...root, text: mindmap[1].trim() } } } : w), message: "Updated the mindmap root." }; }
  return { widgets: input, message: "Try “list widgets”, “add todo: task”, “set notes: text”, “add link: Label | URL”, “hide widget Notes”, or “create calendar”." };
}
