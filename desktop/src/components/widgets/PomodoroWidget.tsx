import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flame, Coffee, Trophy, ListTodo } from "lucide-react";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget } from "../../types/widget";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const PRESETS: Record<TimerMode, { label: string; duration: number; icon: React.ReactNode; color: string }> = {
  focus: { label: "Focus Time", duration: 1500, icon: <Flame size={14} />, color: "text-red-500" },
  shortBreak: { label: "Short Break", duration: 300, icon: <Coffee size={14} />, color: "text-emerald-500" },
  longBreak: { label: "Long Break", duration: 900, icon: <Trophy size={14} />, color: "text-blue-500" }
};

export function PomodoroWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const widgets = useWidgetStore((state) => state.widgets);
  const todoWidget = widgets.find((candidate) => candidate.type === "todo");
  const todoItems = (todoWidget?.data?.items as Array<{ id: string; text: string; done?: boolean }> | undefined) ?? [];
  const activeTaskId = typeof widget.data?.activeTaskId === "string" ? widget.data.activeTaskId : "";

  const initialMode = (widget.data?.mode as TimerMode) || "focus";
  const initialDuration = PRESETS[initialMode].duration;

  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completionNotice, setCompletionNotice] = useState("");

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync external changes if any, or reset when mode changes
    const targetDuration = PRESETS[mode].duration;
    setTimeLeft(targetDuration);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (mode === "focus" && activeTaskId && todoWidget) {
              const task = todoItems.find((item) => item.id === activeTaskId);
              if (task && !task.done) {
                updateWidget(todoWidget.id, {
                  data: {
                    ...todoWidget.data,
                    items: todoItems.map((item) => item.id === activeTaskId ? { ...item, done: true } : item)
                  }
                });
                setCompletionNotice(`Completed: ${task.text}`);
              }
            }
            // Play notification or sound could go here
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTaskId, isRunning, mode, todoItems, todoWidget, updateWidget]);

  const handleStartPause = () => {
    if (!isRunning && mode === "focus" && todoWidget && !activeTaskId) {
      const firstOpenTask = todoItems.find((item) => !item.done);
      if (firstOpenTask) {
        updateWidget(widget.id, { data: { ...widget.data, activeTaskId: firstOpenTask.id } });
      }
    }
    setCompletionNotice("");
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(PRESETS[mode].duration);
  };

  const selectTask = (taskId: string) => {
    setCompletionNotice("");
    updateWidget(widget.id, { data: { ...widget.data, activeTaskId: taskId || undefined } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = PRESETS[mode].duration;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 220 - progress * 220;

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-2 select-none">
      {/* Modes */}
      <div className="flex gap-1.5 rounded-lg bg-black/5 dark:bg-white/5 p-1 w-full max-w-xs">
        {(Object.keys(PRESETS) as TimerMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                updateWidget(widget.id, { data: { ...widget.data, mode: m } });
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-semibold transition ${
                active
                  ? "bg-white text-black shadow dark:bg-white/10 dark:text-white"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {PRESETS[m].icon}
              <span className="hidden sm:inline">{m === "shortBreak" ? "Short" : m === "longBreak" ? "Long" : "Focus"}</span>
            </button>
          );
        })}
      </div>

      {mode === "focus" && (
        <div className="flex w-full max-w-xs items-center gap-1.5 rounded-lg bg-black/5 px-2 py-1.5 dark:bg-white/5">
          <ListTodo size={13} className="shrink-0 text-accent" />
          <select
            value={activeTaskId}
            onChange={(event) => selectTask(event.target.value)}
            disabled={isRunning || todoItems.length === 0}
            aria-label="Task for focus session"
            className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"
          >
            <option value="">{todoItems.length ? "Choose a task" : "Add a task first"}</option>
            {todoItems.filter((item) => !item.done).map((item) => (
              <option key={item.id} value={item.id}>{item.text}</option>
            ))}
          </select>
        </div>
      )}

      {/* Progress & Time */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-28 h-28 transform -rotate-90">
          {/* Track */}
          <circle
            cx="56"
            cy="56"
            r="35"
            className="stroke-black/5 dark:stroke-white/5"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx="56"
            cy="56"
            r="35"
            className={`transition-all duration-300 stroke-accent`}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray="220"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight">{formatTime(timeLeft)}</span>
          <span className={`text-[8px] font-semibold uppercase tracking-wider ${PRESETS[mode].color}`}>
            {PRESETS[mode].label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="rounded-full p-2 bg-black/5 dark:bg-white/5 text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text transition"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={handleStartPause}
          className="rounded-full p-3 bg-accent text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
      </div>
      {completionNotice && <p className="max-w-xs truncate text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{completionNotice}</p>}
    </div>
  );
}
