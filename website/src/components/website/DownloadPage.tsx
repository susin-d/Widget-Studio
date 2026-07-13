import { useEffect, useState } from "react";
import { ArrowRight, Check, Download, ExternalLink, FileDown, Laptop, ShieldCheck, Sparkles, Timer, WifiOff } from "lucide-react";

interface InstallerMetadata {
  version: string;
  fileName: string;
  downloadUrl: string;
}

const defaultInstaller: InstallerMetadata = { version: "0.1.0", fileName: "WidgetStudioInstaller.msi", downloadUrl: "/WidgetStudioInstaller.msi" };

export function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [installer, setInstaller] = useState<InstallerMetadata>(defaultInstaller);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/installer.json", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Partial<InstallerMetadata>> : null)
      .then((metadata) => {
        if (!metadata?.version || !metadata.fileName || !metadata.downloadUrl) return;
        setInstaller({ version: metadata.version, fileName: metadata.fileName, downloadUrl: metadata.downloadUrl });
      }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const triggerDownload = () => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = installer.downloadUrl;
    link.download = installer.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => setDownloading(false), 2200);
  };

  return (
    <div className="marketing-page page-with-top-space">
      <div className="site-noise" aria-hidden="true" />
      <div className="site-container download-hero"><div className="download-copy"><div className="eyebrow"><Laptop size={14} /> The native Widget Studio experience</div><h1>Your desktop,<br /><em>in its element.</em></h1><p>Bring your canvas out of the browser and onto the Windows desktop. Keep your focus timer, notes, links, and layout one glance away.</p><div className="download-points"><span><Check size={15} /> Windows 10 & 11 · x64</span><span><Check size={15} /> Lightweight native client</span><span><Check size={15} /> Works offline, syncs when you return</span></div></div><div className="installer-card"><div className="installer-card-top"><div className="installer-icon"><Download size={23} /></div><span className="installer-status"><i /> ready to install</span></div><div><span className="card-overline">Latest stable build</span><h2>Widget Studio for Windows</h2><p>Version {installer.version} · MSI installer · x64</p></div><button type="button" onClick={triggerDownload} className="site-button site-button-primary site-button-large installer-button">{downloading ? <><Timer size={17} className="spin-slow" /> Starting download…</> : <><FileDown size={17} /> Download installer <ArrowRight size={16} /></>}</button><div className="installer-meta"><span><ShieldCheck size={13} /> signed package</span><span>~ 48 MB</span></div></div></div>

      <section className="site-container install-guide"><div className="section-heading-row"><div><div className="eyebrow">Three quiet steps</div><h2>From download to done.</h2></div><p>No account is required to try the desktop client. Sign in when you want your layout to travel with you.</p></div><div className="install-steps"><article><span>01</span><div><h3>Download the MSI</h3><p>Save the installer and open it when you are ready. Windows handles the rest.</p></div></article><article><span>02</span><div><h3>Choose your setup</h3><p>Pick a start-on-boot preference, then launch your first workspace.</p></div></article><article><span>03</span><div><h3>Place the useful things</h3><p>Pin widgets to the desktop and let the layout become part of your rhythm.</p></div></article></div></section>

      <section className="site-container download-details"><div className="detail-card"><WifiOff size={18} /><div><h3>Works without a connection</h3><p>Your local layout stays available offline. Sync resumes when you are back online.</p></div></div><div className="detail-card"><Sparkles size={18} /><div><h3>Made to stay out of the way</h3><p>Native overlays, gentle materials, and a small footprint keep the desktop feeling like yours.</p></div></div><a className="detail-card detail-card-link" href="/WidgetStudioInstaller.msi" target="_blank" rel="noreferrer"><ExternalLink size={18} /><div><h3>Prefer a direct link?</h3><p>Open the current installer package in a new tab.</p></div><ArrowRight size={15} /></a></section>
    </div>
  );
}
