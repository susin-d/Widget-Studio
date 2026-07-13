import { useEffect, useMemo, useRef, useState } from "react";
import type { CustomWidgetPermission, CustomWidgetPermissions, CustomWidgetSource } from "../../types/customWidget";
import { CUSTOM_WIDGET_PERMISSIONS } from "../../types/customWidget";
import { buildCustomWidgetSrcDoc } from "../../lib/customWidget";
import { isTauri, nativeApi } from "../../lib/tauri";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { open } from "@tauri-apps/plugin-shell";

interface CustomWidgetRuntimeProps {
  name: string;
  source: CustomWidgetSource;
  permissions: CustomWidgetPermissions;
  onPermissionsChange: (permissions: CustomWidgetPermissions) => void;
  onRuntimeError?: (message: string | null) => void;
  className?: string;
}

export function CustomWidgetRuntime({ name, source, permissions, onPermissionsChange, onRuntimeError, className = "" }: CustomWidgetRuntimeProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const srcDoc = useMemo(() => buildCustomWidgetSrcDoc(source), [source]);

  useEffect(() => {
    setRuntimeError(null);
    onRuntimeError?.(null);
  }, [srcDoc, onRuntimeError]);

  useEffect(() => {
    const reply = (id: string, ok: boolean, value?: unknown, error?: string) => frame.current?.contentWindow?.postMessage({ type: "widget-studio-result", id, ok, value, error }, "*");
    const report = (message: string) => {
      setRuntimeError(message);
      onRuntimeError?.(message);
    };
    const receive = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data) return;
      if (event.data.type === "widget-studio-runtime-error") {
        report(String(event.data.message || "Widget runtime error"));
        return;
      }
      if (event.data.type !== "widget-studio-request") return;
      const { id, permission, payload } = event.data as { id?: string; permission?: string; payload?: unknown };
      if (!id || !permission) return;
      if (!CUSTOM_WIDGET_PERMISSIONS.includes(permission as CustomWidgetPermission)) {
        reply(id, false, undefined, "Unknown permission");
        return;
      }
      const permissionName = permission as CustomWidgetPermission;
      let granted = permissions[permissionName];
      if (granted === undefined) {
        granted = window.confirm(`“${name}” requests ${permissionName} permission. Allow this widget to use it?`);
        onPermissionsChange({ ...permissions, [permissionName]: granted });
      }
      if (!granted) {
        reply(id, false, undefined, "Permission denied");
        return;
      }
      try {
        if (permissionName === "clipboard") {
          const text = String((payload as { text?: string })?.text ?? "");
          if (isTauri) await nativeApi.copyToClipboard(text);
          else await navigator.clipboard.writeText(text);
          reply(id, true, true);
        } else if (permissionName === "notifications") {
          const title = String((payload as { title?: string })?.title ?? name);
          const body = String((payload as { body?: string })?.body ?? "");
          if (isTauri) await sendNotification({ title, body });
          else { if (Notification.permission === "default") await Notification.requestPermission(); if (Notification.permission !== "granted") throw new Error("Notification permission denied"); new Notification(title, { body }); }
          reply(id, true, true);
        } else if (permissionName === "openExternal") {
          const url = String((payload as { url?: string })?.url ?? "");
          if (!/^https?:\/\//i.test(url)) throw new Error("Only HTTP(S) URLs are allowed");
          if (isTauri) await open(url);
          else window.open(url, "_blank", "noopener,noreferrer");
          reply(id, true, true);
        } else {
          const request = payload as { url?: string; options?: RequestInit };
          const url = String(request?.url ?? "");
          if (!/^https:\/\//i.test(url)) throw new Error("Only HTTPS requests are allowed");
          const response = await fetch(url, { ...request.options, credentials: "omit" });
          reply(id, true, { status: response.status, text: await response.text() });
        }
      } catch (error) {
        reply(id, false, undefined, error instanceof Error ? error.message : "Request failed");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [name, onPermissionsChange, onRuntimeError, permissions]);

  return <div className={`relative h-full w-full ${className}`}>
    <iframe ref={frame} title={name} sandbox="allow-scripts" srcDoc={srcDoc} className="h-full w-full border-0 bg-transparent" />
    {runtimeError && <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md border border-red-300 bg-red-50/95 px-2 py-1.5 text-[11px] text-red-700 shadow-sm">{runtimeError}</div>}
  </div>;
}
