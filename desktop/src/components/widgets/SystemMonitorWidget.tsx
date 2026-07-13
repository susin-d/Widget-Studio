import { Cpu } from "lucide-react";
import { useSystemInfo } from "../../hooks/useSystemInfo";

export function SystemMonitorWidget() {
  const info = useSystemInfo();
  const ram = info ? Math.round((info.ram_used / Math.max(info.ram_total, 1)) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Cpu size={20} className="text-accent" /><span className="font-medium">System</span></div>
      <Meter label="CPU" value={info?.cpu_usage ?? 0} />
      <Meter label="RAM" value={ram} />
      {info?.battery_level != null && <Meter label="Battery" value={info.battery_level} />}
      {!info && <p className="text-xs text-muted">Native system info appears when running in Tauri.</p>}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span>{Math.round(value)}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </div>
  );
}
