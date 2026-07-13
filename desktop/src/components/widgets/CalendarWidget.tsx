import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Plus, Trash2 } from "lucide-react";
import type { DesktopWidget } from "../../types/widget";
import { useWidgetStore } from "../../store/widgetStore";

export function CalendarWidget({ widget }: { widget?: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const widgets = useWidgetStore((state) => state.widgets);
  const events = (widget?.data?.events as Record<string, string[]> | undefined) ?? {};
  const todoWidget = widgets.find((candidate) => candidate.type === "todo");
  const todoItems = (todoWidget?.data?.items as Array<{ id: string; text: string; done?: boolean; deadline?: string }> | undefined) ?? [];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
    setIsAddingEvent(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
    setIsAddingEvent(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: firstDayIndex }, () => null as number | null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1 as number | null);
  const cells = blanks.concat(days);

  const getDateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const getTaskDateKey = (deadline: string) => {
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return null;
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${mm}-${dd}`;
  };

  const eventsForDay = (day: number) => {
    const key = getDateKey(day);
    const taskEvents = todoItems
      .filter((item) => item.deadline && getTaskDateKey(item.deadline) === key)
      .map((item) => ({ text: `${item.done ? "✓" : "•"} ${item.text}`, taskId: item.id, done: Boolean(item.done) }));
    return [
      ...(events[key] ?? []).map((text) => ({ text, taskId: undefined, done: false })),
      ...taskEvents
    ];
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widget || selectedDay === null || !newEvent.trim()) return;
    const key = getDateKey(selectedDay);
    const dayEvents = events[key] ?? [];
    const nextEvents = { ...events, [key]: [...dayEvents, newEvent.trim()] };
    updateWidget(widget.id, { data: { ...widget.data, events: nextEvents } });
    setNewEvent("");
    setIsAddingEvent(false);
  };

  const removeEvent = (day: number, index: number) => {
    if (!widget) return;
    const key = getDateKey(day);
    const dayEvents = events[key] ?? [];
    const nextDayEvents = dayEvents.filter((_, i) => i !== index);
    const nextEvents = { ...events };
    if (nextDayEvents.length === 0) {
      delete nextEvents[key];
    } else {
      nextEvents[key] = nextDayEvents;
    }
    updateWidget(widget.id, { data: { ...widget.data, events: nextEvents } });
  };

  const dayHasEvents = (day: number) => {
    return eventsForDay(day).length > 0;
  };

  const toggleTask = (taskId: string) => {
    if (!todoWidget) return;
    const nextItems = todoItems.map((item) => item.id === taskId ? { ...item, done: !item.done } : item);
    updateWidget(todoWidget.id, { data: { ...todoWidget.data, items: nextItems } });
  };

  return (
    <div className="flex h-full flex-col justify-between space-y-2">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/5">
          <span className="text-sm font-semibold">
            {currentDate.toLocaleDateString([], { month: "long", year: "numeric" })}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5">
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mt-2 text-center text-[10px] font-semibold text-muted">
          {"SMTWTFS".split("").map((d, i) => <span key={i}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-1 text-center text-xs">
          {cells.map((day, index) => {
            if (day === null) return <span key={index} />;
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = selectedDay === day;
            const hasEvent = dayHasEvents(day);

            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDay(isSelected ? null : day);
                  setIsAddingEvent(false);
                }}
                className={`relative flex flex-col items-center justify-center rounded-md py-1 font-medium transition hover:bg-black/5 dark:hover:bg-white/5 ${
                  isSelected ? "bg-accent/25 text-accent" : isToday ? "bg-accent text-white" : ""
                }`}
              >
                <span>{day}</span>
                {hasEvent && (
                  <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday ? "bg-white" : "bg-accent"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay !== null && widget && (
        <div className="border-t border-black/10 pt-2 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted mb-1.5">
            <span>Events on {currentDate.getMonth() + 1}/{selectedDay}</span>
            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="text-accent flex items-center gap-0.5 hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {isAddingEvent ? (
            <form onSubmit={addEvent} className="flex gap-1.5 mb-1.5">
              <input
                type="text"
                autoFocus
                placeholder="New event..."
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                className="min-w-0 flex-1 rounded border border-black/10 bg-white/40 px-2 py-0.5 text-xs outline-none focus:border-accent dark:border-white/10 dark:bg-black/10"
              />
              <button type="submit" className="rounded bg-accent px-2 py-0.5 text-xs text-white hover:brightness-110">
                Save
              </button>
            </form>
          ) : null}

          <div className="max-h-20 overflow-y-auto space-y-1">
            {eventsForDay(selectedDay).map((evt, idx) => (
              <div key={evt.taskId ?? `event-${idx}`} className="flex items-center justify-between rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/5 group/evt">
                <span className={`flex min-w-0 items-center gap-1 truncate pr-2 ${evt.taskId ? "text-accent" : ""}`}>
                  {evt.taskId && (evt.done ? <CheckCircle2 size={11} /> : <Circle size={11} />)}
                  <span className="truncate">{evt.text}</span>
                </span>
                {evt.taskId ? (
                  <button type="button" onClick={() => toggleTask(evt.taskId!)} title={evt.done ? "Reopen task" : "Complete task"} className="shrink-0 text-accent hover:underline">
                    {evt.done ? "Reopen" : "Done"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeEvent(selectedDay, idx)}
                    aria-label="Delete event"
                    className="shrink-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            {eventsForDay(selectedDay).length === 0 && !isAddingEvent ? (
              <p className="text-[10px] text-muted italic">No events today.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
