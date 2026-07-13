import { useSyncExternalStore } from "react";
import { nativeApi, type SystemInfo } from "../lib/tauri";

const REFRESH_INTERVAL_MS = 5_000;

let snapshot: SystemInfo | null = null;
let refreshTimer: number | null = null;
let refreshInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: SystemInfo | null) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function refreshSystemInfo(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = nativeApi.getSystemInfo()
    .then((info) => publish(info))
    .catch(() => publish(null))
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function refreshWhenVisible() {
  if (document.visibilityState === "visible") void refreshSystemInfo();
}

function startPolling() {
  if (refreshTimer !== null) return;
  document.addEventListener("visibilitychange", refreshWhenVisible);
  refreshWhenVisible();
  refreshTimer = window.setInterval(refreshWhenVisible, REFRESH_INTERVAL_MS);
}

function stopPolling() {
  if (refreshTimer !== null) window.clearInterval(refreshTimer);
  refreshTimer = null;
  document.removeEventListener("visibilitychange", refreshWhenVisible);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) startPolling();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopPolling();
  };
}

function getSnapshot() {
  return snapshot;
}

export function useSystemInfo(): SystemInfo | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
