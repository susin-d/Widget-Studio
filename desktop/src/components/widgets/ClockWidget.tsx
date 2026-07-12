import { useEffect, useState } from "react";
import { useSettingsStore } from "../../store/settingsStore";

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const desktopMode = useSettingsStore((state) => state.settings.desktopMode);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (desktopMode) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center uppercase tracking-[0.28em]">
        <div className="text-[11px] font-light tracking-[0.3em]">{now.toLocaleTimeString([], { second: "2-digit" }).slice(-2)}s</div>
        <div className="mt-2 text-4xl font-extralight tabular-nums tracking-normal">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
        <div className="mt-3 h-px w-20 bg-white/55" />
        <div className="mt-3 text-xs font-light tracking-[0.18em]">{now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}</div>
        <div className="mt-6 text-4xl font-extralight tracking-[0.32em]">{now.toLocaleDateString([], { weekday: "long" })}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="text-5xl font-semibold tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="mt-2 text-sm text-muted">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
    </div>
  );
}
