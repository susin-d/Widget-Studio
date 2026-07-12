import { useState, useEffect } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget } from "../../types/widget";

interface ClockItem {
  id: string;
  label: string;
  timezone: string;
}

const AVAILABLE_TIMEZONES = [
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "New York (EST/EDT)", value: "America/New-York" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Paris (CET/CEST)", value: "Europe/Paris" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Dubai (GST)", value: "Asia/Dubai" }
];

export function WorldClockWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const clocks = (widget.data?.clocks as ClockItem[]) || [];

  const [time, setTime] = useState(new Date());
  const [selectedTz, setSelectedTz] = useState(AVAILABLE_TIMEZONES[0].value);
  const [customLabel, setCustomLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeForTimezone = (date: Date, timeZone: string) => {
    try {
      return date.toLocaleTimeString([], {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    } catch {
      return "Invalid TZ";
    }
  };

  const handleAddClock = () => {
    const tzInfo = AVAILABLE_TIMEZONES.find((t) => t.value === selectedTz);
    const label = customLabel.trim() || tzInfo?.label.split(" (")[0] || "Clock";
    const newClock: ClockItem = {
      id: `clock-${Date.now()}`,
      label,
      timezone: selectedTz
    };
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        clocks: [...clocks, newClock]
      }
    });
    setCustomLabel("");
    setIsAdding(false);
  };

  const handleRemoveClock = (id: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        clocks: clocks.filter((c) => c.id !== id)
      }
    });
  };

  return (
    <div className="h-full w-full flex flex-col p-2.5 select-none overflow-y-auto">
      {/* Clock List */}
      <div className="flex-1 space-y-2">
        {clocks.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg bg-black/5 dark:bg-white/5 p-2 transition hover:bg-black/10 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-accent" />
              <div>
                <div className="text-xs font-semibold">{c.label}</div>
                <div className="text-[9px] text-muted truncate max-w-[120px]">{c.timezone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold tracking-tight">
                {formatTimeForTimezone(time, c.timezone)}
              </span>
              <button
                onClick={() => handleRemoveClock(c.id)}
                className="text-muted hover:text-red-500 rounded p-1 transition"
                title="Remove clock"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}

        {clocks.length === 0 && !isAdding && (
          <div className="text-center py-6 text-xs text-muted">No clocks added. Add one below.</div>
        )}
      </div>

      {/* Add Controls */}
      {isAdding ? (
        <div className="mt-3 bg-panel border border-black/10 dark:border-white/10 rounded-lg p-2 space-y-2">
          <div className="text-[10px] font-semibold text-muted">Configure Timezone</div>
          <select
            value={selectedTz}
            onChange={(e) => setSelectedTz(e.target.value)}
            className="w-full text-xs bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 p-1 outline-none"
          >
            {AVAILABLE_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-panel text-text">
                {tz.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Label (e.g. London)"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="w-full text-xs bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 p-1.5 outline-none placeholder:text-muted"
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="text-[10px] px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleAddClock}
              className="text-[10px] px-2 py-1 rounded bg-accent text-white font-semibold shadow hover:scale-[1.02]"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-dashed border-black/20 dark:border-white/20 text-xs text-muted hover:border-accent hover:text-accent transition duration-200"
        >
          <Plus size={13} />
          <span>Add Clock</span>
        </button>
      )}
    </div>
  );
}
