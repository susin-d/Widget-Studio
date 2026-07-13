import type { DesktopWidget, WidgetKind } from "../types/widget";
import { createWidget } from "../store/widgetStore";

export interface WidgetAgentResult {
  widgets: DesktopWidget[];
  message: string;
}

const typeAliases: Record<string, WidgetKind> = {
  clock: "clock", weather: "weather", todo: "todo", task: "todo", notes: "notes", note: "notes",
  links: "links", link: "links", calendar: "calendar", mindmap: "mindmap", pomodoro: "pomodoro",
  timer: "pomodoro", worldclock: "worldclock", stickynotes: "stickynotes", sticky: "stickynotes",
  calculator: "calculator", chatbot: "chatbot", ai: "chatbot", custom: "custom", system: "system",
  browser: "browser", web: "browser", website: "browser"
};

const splitPayload = (value: string) => value.split(/\s*\|\s*/, 2).map((part) => part.trim());
const findWidget = (widgets: DesktopWidget[], query: string) => {
  const needle = query.trim().toLowerCase();
  return widgets.find((widget) => widget.name.toLowerCase() === needle)
    ?? widgets.find((widget) => widget.type === typeAliases[needle])
    ?? widgets.find((widget) => widget.name.toLowerCase().includes(needle) || widget.type === needle);
};

interface TodoItem {
  id: string;
  text: string;
  done?: boolean;
  deadline?: string;
  notified?: boolean;
}

const todoItems = (widget: DesktopWidget): TodoItem[] =>
  Array.isArray(widget.data?.items) ? widget.data.items as TodoItem[] : [];

const findTodoItem = (widget: DesktopWidget, query: string) => {
  const needle = query.trim().toLowerCase();
  const items = todoItems(widget);
  if (/^(?:the )?(?:current|first|top) (?:todo|task)$/.test(needle) || /^(?:current|first|top)$/.test(needle)) {
    return items[0];
  }
  return items.find((item) => item.text.trim().toLowerCase() === needle)
    ?? items.find((item) => item.text.toLowerCase().includes(needle));
};

const updateTodoItems = (widgets: DesktopWidget[], todo: DesktopWidget, items: TodoItem[]) =>
  widgets.map((widget) => widget.id === todo.id
    ? { ...widget, data: { ...widget.data, items } }
    : widget);

export function executeWidgetCommand(command: string, input: DesktopWidget[]): WidgetAgentResult {
  const widgets = input.map((widget) => ({ ...widget, data: widget.data ? { ...widget.data } : {} }));
  const value = command.trim();
  const lower = value.toLowerCase();
  if (!value) return { widgets: input, message: "Enter a widget command." };

  if (/^(list|show) (all )?widgets$/.test(lower) || lower === "inspect workspace") {
    return { widgets: input, message: widgets.length ? widgets.map((widget) => `${widget.name} (${widget.type}${widget.hidden ? ", hidden" : ""})`).join(" · ") : "No widgets are installed." };
  }

  const createMatch = lower.match(/^(?:create|add|install) (?:a )?([a-z]+)(?: widget)?$/);
  if (createMatch && typeAliases[createMatch[1]]) {
    const type = typeAliases[createMatch[1]];
    const created = createWidget(type, widgets.length);
    return { widgets: [...widgets, created], message: `Created ${created.name}.` };
  }

  const deleteMatch = value.match(/^(?:delete|remove) widget\s*:?\s*(.+)$/i);
  if (deleteMatch) {
    const target = findWidget(widgets, deleteMatch[1]);
    if (!target) return { widgets: input, message: `I couldn't find widget “${deleteMatch[1]}”.` };
    return { widgets: widgets.filter((widget) => widget.id !== target.id), message: `Removed ${target.name}.` };
  }

  const visibility = lower.match(/^(show|hide|pin|unpin|lock|unlock) (?:all )?widgets?$/);
  if (visibility) {
    const action = visibility[1];
    const next = widgets.map((widget) => ({ ...widget,
      ...(action === "show" ? { hidden: false } : {}), ...(action === "hide" ? { hidden: true } : {}),
      ...(action === "pin" ? { pinned: true, locked: true } : {}), ...(action === "unpin" ? { pinned: false, locked: false } : {}),
      ...(action === "lock" ? { locked: true } : {}), ...(action === "unlock" ? { locked: false } : {})
    }));
    return { widgets: next, message: `${action[0].toUpperCase()}${action.slice(1)}d ${widgets.length} widget${widgets.length === 1 ? "" : "s"}.` };
  }

  const targeted = lower.match(/^(show|hide|pin|unpin|lock|unlock) widget\s+(.+)$/);
  if (targeted) {
    const target = findWidget(widgets, targeted[2]);
    if (!target) return { widgets: input, message: `I couldn't find widget “${targeted[2]}”.` };
    const action = targeted[1];
    const next = widgets.map((widget) => widget.id !== target.id ? widget : ({ ...widget,
      ...(action === "show" ? { hidden: false } : {}), ...(action === "hide" ? { hidden: true } : {}),
      ...(action === "pin" ? { pinned: true, locked: true } : {}), ...(action === "unpin" ? { pinned: false, locked: false } : {}),
      ...(action === "lock" ? { locked: true } : {}), ...(action === "unlock" ? { locked: false } : {})
    }));
    return { widgets: next, message: `${action[0].toUpperCase()}${action.slice(1)}d ${target.name}.` };
  }

  const todoAdd = value.match(/^(?:add|create) (?:todo|task):\s*(.+)$/i);
  if (todoAdd) {
    let todo: DesktopWidget | undefined = widgets.find((widget) => widget.type === "todo");
    let next: DesktopWidget[] = widgets;
    if (!todo) { todo = createWidget("todo", widgets.length); next = [...widgets, todo]; }
    next = next.map((widget) => widget.id === todo!.id ? { ...widget, data: { ...widget.data, items: [...(Array.isArray(widget.data?.items) ? widget.data.items : []), { id: crypto.randomUUID(), text: todoAdd[1].trim(), done: false }] } } : widget);
    return { widgets: next, message: `Added task “${todoAdd[1].trim()}”.` };
  }

  const todoList = value.match(/^(?:list|show)(?: my)? (?:todo|tasks?)$/i);
  if (todoList) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    const items = todoItems(todo);
    return { widgets: input, message: items.length
      ? items.map((item, index) => `${index + 1}. ${item.text}${item.done ? " (done)" : ""}`).join(" · ")
      : "Your Todo list is empty." };
  }

  const editTodo = value.match(/^(?:edit|update|rename|change) (?:todo |task )?(.+?)\s+(?:to|as)\s+(.+)$/i)
    ?? value.match(/^(?:edit|update|rename|change) (?:todo |task )?:\s*(.+?)\s*\|\s*(.+)$/i);
  if (editTodo) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    const item = findTodoItem(todo, editTodo[1]);
    if (!item) return { widgets: input, message: `I couldn't find task “${editTodo[1]}”.` };
    const text = editTodo[2].trim();
    if (!text) return { widgets: input, message: "The new task text cannot be empty." };
    const nextItems = todoItems(todo).map((candidate) => candidate.id === item.id ? { ...candidate, text } : candidate);
    return { widgets: updateTodoItems(widgets, todo, nextItems), message: `Renamed task to “${text}”.` };
  }

  const deleteTodo = value.match(/^(?:delete|remove|clear) (?:todo |task )?(.+)$/i);
  if (deleteTodo && !/^(?:all|every) tasks?$/i.test(deleteTodo[1].trim())) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    const item = findTodoItem(todo, deleteTodo[1]);
    if (!item) return { widgets: input, message: `I couldn't find task “${deleteTodo[1]}”.` };
    return { widgets: updateTodoItems(widgets, todo, todoItems(todo).filter((candidate) => candidate.id !== item.id)), message: `Deleted task “${item.text}”.` };
  }

  const clearTodos = value.match(/^(?:clear|delete|remove) (?:all|every) (?:todo|tasks?)$/i);
  if (clearTodos) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    return { widgets: updateTodoItems(widgets, todo, []), message: "Cleared the Todo list." };
  }

  const completeTodo = value.match(/^(?:complete|finish|check off|mark done) (?:todo |task )?(.+)$/i);
  if (completeTodo && !/^(?:all|every) tasks?$/i.test(completeTodo[1].trim())) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    const item = findTodoItem(todo, completeTodo[1]);
    if (!item) return { widgets: input, message: `I couldn't find task “${completeTodo[1]}”.` };
    return { widgets: updateTodoItems(widgets, todo, todoItems(todo).map((candidate) => candidate.id === item.id ? { ...candidate, done: true } : candidate)), message: `Completed task “${item.text}”.` };
  }

  const reopenTodo = value.match(/^(?:reopen|uncomplete|mark not done) (?:todo |task )?(.+)$/i);
  if (reopenTodo) {
    const todo = widgets.find((widget) => widget.type === "todo");
    if (!todo) return { widgets: input, message: "No Todo widget is installed." };
    const item = findTodoItem(todo, reopenTodo[1]);
    if (!item) return { widgets: input, message: `I couldn't find task “${reopenTodo[1]}”.` };
    return { widgets: updateTodoItems(widgets, todo, todoItems(todo).map((candidate) => candidate.id === item.id ? { ...candidate, done: false, notified: false } : candidate)), message: `Reopened task “${item.text}”.` };
  }

  if (/^(complete|finish|check off) (all )?(todo|tasks?)$/i.test(value)) {
    return { widgets: widgets.map((widget) => widget.type === "todo" ? { ...widget, data: { ...widget.data, items: (Array.isArray(widget.data?.items) ? widget.data.items : []).map((item: any) => ({ ...item, done: true })) } } : widget), message: "Completed every Todo task." };
  }
  const note = value.match(/^set (?:the )?note(?:s)?(?: to)?:\s*(.+)$/i);
  if (note) {
    const target = widgets.find((widget) => widget.type === "notes");
    if (!target) return { widgets: input, message: "No Notes widget is installed." };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, text: note[1].trim() } } : widget), message: "Updated the Notes widget." };
  }
  const location = value.match(/^(?:set|change) (?:weather )?location(?: to)?:\s*(.+)$/i);
  if (location) {
    const target = widgets.find((widget) => widget.type === "weather");
    if (!target) return { widgets: input, message: "No Weather widget is installed." };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, location: location[1].trim() } } : widget), message: `Weather location set to ${location[1].trim()}.` };
  }
  const link = value.match(/^add link:\s*(.+)$/i);
  if (link) {
    const [label, url] = splitPayload(link[1]);
    if (!label || !url) return { widgets: input, message: "Use: add link: Label | https://example.com" };
    const target = widgets.find((widget) => widget.type === "links");
    if (!target) return { widgets: input, message: "No Quick Links widget is installed." };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, links: [...(Array.isArray(widget.data?.links) ? widget.data.links : []), { label, url }] } } : widget), message: `Added link “${label}”.` };
  }
  const sticky = value.match(/^add sticky(?: note)?:\s*(.+)$/i);
  if (sticky) {
    const [title, content] = splitPayload(sticky[1]);
    const target = widgets.find((widget) => widget.type === "stickynotes");
    if (!target) return { widgets: input, message: "No Sticky Notepad widget is installed." };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, notes: [{ id: crypto.randomUUID(), title: title || "Untitled", content: content || "", color: "bg-amber-100 dark:bg-amber-950/40 border-amber-300" }, ...(Array.isArray(widget.data?.notes) ? widget.data.notes : [])] } } : widget), message: `Added sticky note “${title || "Untitled"}”.` };
  }
  const event = value.match(/^add event:\s*(.+)$/i);
  if (event) {
    const [date, text] = splitPayload(event[1]);
    const target = widgets.find((widget) => widget.type === "calendar");
    if (!target || !date || !text) return { widgets: input, message: "Use: add event: YYYY-MM-DD | Event text" };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, events: { ...(widget.data?.events as Record<string, string[]> ?? {}), [date]: [...((widget.data?.events as Record<string, string[]> ?? {})[date] ?? []), text] } } } : widget), message: `Added calendar event “${text}” on ${date}.` };
  }
  const mindmap = value.match(/^set mindmap(?: root)?(?: to)?:\s*(.+)$/i);
  if (mindmap) {
    const target = widgets.find((widget) => widget.type === "mindmap");
    if (!target) return { widgets: input, message: "No Mindmap widget is installed." };
    const root = (target.data?.root as Record<string, unknown> | undefined) ?? { id: "root", children: [] };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, root: { ...root, text: mindmap[1].trim() } } } : widget), message: "Updated the mindmap root." };
  }
  const timer = value.match(/^(?:set|switch) (?:pomodoro|timer)(?: mode)? to (focus|short break|long break)$/i);
  if (timer) {
    const mode = timer[1].toLowerCase().replace(" ", "") === "shortbreak" ? "shortBreak" : timer[1].toLowerCase().replace(" ", "") === "longbreak" ? "longBreak" : "focus";
    const target = widgets.find((widget) => widget.type === "pomodoro");
    if (!target) return { widgets: input, message: "No Pomodoro widget is installed." };
    return { widgets: widgets.map((widget) => widget.id === target.id ? { ...widget, data: { ...widget.data, mode } } : widget), message: `Pomodoro mode set to ${timer[1]}.` };
  }
  return { widgets: input, message: "I couldn't match that command. Try “list widgets”, “add todo: task”, “set notes: text”, “add link: Label | URL”, “hide widget Notes”, or “create calendar”." };
}
