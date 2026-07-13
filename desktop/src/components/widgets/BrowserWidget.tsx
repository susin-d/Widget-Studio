import { Webview } from "@tauri-apps/api/webview";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { BrowserWidgetData } from "../../types/browserWidget";
import { browserWidgetData } from "../../types/browserWidget";
import type { DesktopWidget } from "../../types/widget";
import { isTauri } from "../../lib/tauri";

interface BrowserWidgetProps {
  widget: DesktopWidget;
  overlay?: boolean;
}

export function BrowserWidget({ widget, overlay = false }: BrowserWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<Webview | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const data = browserWidgetData(widget.data) as BrowserWidgetData;
  const nativeOverlay = isTauri && overlay;

  useEffect(() => {
    setLoading(true);
    setIframeError(false);
  }, [data.url, nativeOverlay]);

  useEffect(() => {
    if (!nativeOverlay || !hostRef.current) return;

    const host = hostRef.current;
    const label = `browser-${widget.id}`;
    let webview: Webview | null = null;
    let observer: ResizeObserver | null = null;
    const syncBounds = () => {
      if (!webview) return;
      const rect = host.getBoundingClientRect();
      void webview.setPosition(new LogicalPosition(0, 30)).catch(() => undefined);
      void webview.setSize(new LogicalSize(
        Math.max(1, Math.round(rect.width)),
        Math.max(1, Math.round(rect.height - 30))
      )).catch(() => undefined);
    };

    try {
      webview = new Webview(getCurrentWindow(), label, {
        url: data.url,
        x: 0,
        y: 30,
        width: Math.max(1, host.clientWidth || widget.rect.width),
        height: Math.max(1, (host.clientHeight || widget.rect.height) - 30),
        focus: false,
        dragDropEnabled: false
      });
      webviewRef.current = webview;
      observer = new ResizeObserver(syncBounds);
      observer.observe(host);
      syncBounds();
    } catch {
      setIframeError(true);
    }

    return () => {
      observer?.disconnect();
      if (webviewRef.current === webview) webviewRef.current = null;
      if (!webview) return;
      void webview.close().catch(() => undefined);
    };
  }, [data.url, nativeOverlay, widget.id]);

  const startDragging = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    void getCurrentWindow().startDragging().catch(() => undefined);
  };

  if (nativeOverlay) {
    return (
      <div ref={hostRef} style={{ width: widget.rect.width, height: widget.rect.height }} className="relative overflow-hidden bg-white">
        <div
          className="absolute inset-x-0 top-0 z-10 flex h-[30px] cursor-move items-center justify-between bg-black/30 px-2 text-[10px] text-white/75 backdrop-blur-sm"
          onPointerDown={startDragging}
        >
          <span className="truncate">{data.url}</span>
          <span className="ml-2 shrink-0">Browser</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={hostRef} className="relative h-full w-full overflow-hidden rounded-[inherit] bg-white">
      {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-white/80 text-xs text-slate-500">Loading {data.url}…</div>}
      {iframeError && <div className="absolute inset-0 z-10 grid place-items-center bg-white p-4 text-center text-xs text-slate-500">This site could not be embedded here. Pin the widget to load it in the desktop webview.</div>}
      <iframe
        title={widget.name}
        src={data.url}
        className="h-full w-full border-0"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setIframeError(true); }}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
