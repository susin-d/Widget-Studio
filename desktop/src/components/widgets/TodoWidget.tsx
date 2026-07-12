import { useState, useEffect } from "react";
import type { DesktopWidget } from "../../types/widget";
import { useWidgetStore } from "../../store/widgetStore";
import { Plus, Trash2, Calendar, Clock, X } from "lucide-react";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  deadline?: string;
  notified?: boolean;
}

export function TodoWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const items = ((widget.data?.items as TodoItem[]) ?? []);
  const [newText, setNewText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [showDeadlineInput, setShowDeadlineInput] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    const interval = setInterval(() => {
      const now = new Date();
      let hasUpdates = false;
      const updatedItems = items.map((item) => {
        if (item.deadline && !item.done && !item.notified) {
          const deadlineDate = new Date(item.deadline);
          if (deadlineDate <= now) {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("Task Deadline Reached", {
                body: item.text,
              });
            }
            hasUpdates = true;
            return { ...item, notified: true };
          }
        }
        return item;
      });

      if (hasUpdates) {
        updateWidget(widget.id, {
          data: {
            ...widget.data,
            items: updatedItems
          }
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [items, widget.id, widget.data, updateWidget]);

  const toggle = (id: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        items: items.map((item) => item.id === id ? { ...item, done: !item.done, notified: !item.done ? false : item.notified } : item)
      }
    });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      done: false,
      deadline: newDeadline || undefined,
      notified: false
    };
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        items: [...items, newItem]
      }
    });
    setNewText("");
    setNewDeadline("");
    setShowDeadlineInput(false);
  };

  const removeTask = (id: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        items: items.filter((item) => item.id !== id)
      }
    });
  };

  const editTask = (id: string, text: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        items: items.map((item) => item.id === id ? { ...item, text } : item)
      }
    });
  };

  const setDeadline = (id: string, deadline: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        items: items.map((item) => item.id === id ? { ...item, deadline: deadline || undefined, notified: false } : item)
      }
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (item: TodoItem) => {
    if (!item.deadline || item.done) return false;
    return new Date(item.deadline) <= new Date();
  };

  return (
    <div className="flex h-full flex-col justify-between space-y-2">
      <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted">No tasks yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 rounded-lg bg-black/5 p-1.5 dark:bg-white/5 group/todo">
              <div className="flex items-center justify-between gap-2">
                <label className="flex flex-1 items-center gap-2 text-sm cursor-pointer min-w-0">
                  <input
                    checked={item.done}
                    onChange={() => toggle(item.id)}
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => editTask(item.id, e.target.value)}
                    className={`min-w-0 flex-1 bg-transparent outline-none ${item.done ? "text-muted line-through" : ""}`}
                  />
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const next = prompt("Enter deadline (e.g. 2026-07-12T20:00) or leave blank to clear:", item.deadline || "");
                      if (next !== null) setDeadline(item.id, next);
                    }}
                    title="Change deadline"
                    className="hidden group-hover/todo:block text-muted hover:text-accent p-1 rounded"
                  >
                    <Calendar size={12} />
                  </button>
                  <button
                    onClick={() => removeTask(item.id)}
                    className="hidden shrink-0 text-red-500 hover:text-red-700 group-hover/todo:block p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {item.deadline && (
                <div className={`flex items-center gap-1 pl-6 text-[10px] ${isOverdue(item) ? "text-red-500 font-semibold" : "text-muted"}`}>
                  <Clock size={10} />
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => {
                      const next = prompt("Enter deadline (e.g. 2026-07-12T20:00) or leave blank to clear:", item.deadline || "");
                      if (next !== null) setDeadline(item.id, next);
                    }}
                  >
                    {formatDate(item.deadline)}
                  </span>
                  {isOverdue(item) && !item.done && <span className="ml-1 text-[9px] uppercase tracking-wider bg-red-500/10 px-1 rounded">Overdue</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <form onSubmit={addTask} className="flex flex-col gap-1.5 pt-2 border-t border-black/10 dark:border-white/10 shrink-0">
        {showDeadlineInput && (
          <div className="flex items-center gap-1.5 text-xs text-muted px-1">
            <span className="shrink-0">Deadline:</span>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => {
                setNewDeadline(e.target.value);
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                  void Notification.requestPermission();
                }
              }}
              className="rounded border border-black/10 bg-white/20 px-1 py-0.5 text-[10px] outline-none dark:border-white/10 dark:bg-black/10"
            />
            <button
              type="button"
              onClick={() => {
                setNewDeadline("");
                setShowDeadlineInput(false);
              }}
              className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="New task..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-black/10 bg-white/30 px-2 py-1 text-xs outline-none focus:border-accent dark:border-white/10 dark:bg-black/10"
          />
          <button
            type="button"
            onClick={() => setShowDeadlineInput(!showDeadlineInput)}
            className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 shrink-0 ${newDeadline ? "text-accent" : "text-muted"}`}
            title="Set optional deadline"
          >
            <Calendar size={14} />
          </button>
          <button
            type="submit"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white hover:brightness-110 shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

