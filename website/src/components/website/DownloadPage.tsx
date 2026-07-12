import { Download, ShieldCheck, Check, Layers, AlertCircle } from "lucide-react";
import { useState } from "react";

export function DownloadPage() {
  const [downloading, setDownloading] = useState(false);

  const triggerDownload = () => {
    setDownloading(true);
    // Trigger download of mock installer file
    const link = document.createElement("a");
    link.href = "/WidgetStudioInstaller.msi";
    link.download = "WidgetStudioInstaller.msi";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  const steps = [
    { num: "01", title: "Download Installer", desc: "Get the lightweight Windows MSI package. Tested clean of malware." },
    { num: "02", title: "Launch setup wizard", desc: "Double click the installer. Follow the simple wizard setup screens." },
    { num: "03", title: "Pin & Sync Layouts", desc: "Launch the client. Sign in to pull your canvas from the database." }
  ];

  return (
    <div className="bg-[#090a0f] text-white min-h-screen py-16 px-6 relative flex items-center justify-center">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left column info */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
            <ShieldCheck size={13} />
            Verified Safe Installer (MSI)
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Install the Desktop{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-[#ff4f87] bg-clip-text text-transparent">
              Client
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Get the full native overlay experience. Unlike browser tabs, the desktop client overlays directly onto your Windows wallpaper, supports hotkeys (Ctrl+W), and launches on system startup automatically.
          </p>

          <div className="space-y-3.5 pt-2">
            {[
              "Windows 10 / 11 Desktop (x64 architecture)",
              "Tauri-native WebView runtime automatically integrated",
              "Less than 50MB disk space required for installer",
              "Zero spyware or background resource telemetry logs"
            ].map((spec) => (
              <div key={spec} className="flex gap-2.5 text-xs text-slate-300">
                <Check size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <span>{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column downloader */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl relative space-y-8">
          <div className="text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Download size={24} className={downloading ? "animate-bounce" : ""} />
            </div>
            
            <div>
              <h3 className="text-lg font-bold">Widget Studio Setup</h3>
              <p className="text-[11px] text-slate-500 mt-1">Version 1.0.0 · Windows Installer (x64)</p>
            </div>

            <button
              onClick={triggerDownload}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
            >
              {downloading ? "Starting Download..." : "Download Installer (.msi)"}
            </button>
          </div>

          {/* Setup steps */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Installation Walkthrough</h4>
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.num} className="flex gap-3 text-xs">
                  <span className="font-mono text-indigo-400 font-bold shrink-0 mt-0.5">{s.num}</span>
                  <div>
                    <h5 className="font-bold text-slate-200">{s.title}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
