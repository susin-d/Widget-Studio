import type { AppSettings, PersistedState } from "../types/widget";
import { nativeApi, isTauri } from "./tauri";

const STORAGE_KEY = "desktop-widgets-state";
let lastCloudUpdatedAt: string | null = null;

export const defaultSettings: AppSettings = {
  theme: "system",
  colorTheme: "berry-pop",
  widgetBackground: "glass",
  accentColor: "#ff4f87",
  blurIntensity: 18,
  shadowIntensity: 0.18,
  cornerRadius: 18,
  defaultSize: { width: 300, height: 220 },
  alwaysOnTop: false,
  launchOnStartup: true,
  restoreWidgetsOnLaunch: true,
  snapToGrid: true,
  lockPositions: false,
  skipTaskbar: false,
  desktopMode: false,
  onboardingComplete: false
};

export const emptyState = (): PersistedState => ({
  version: 2,
  widgets: [],
  settings: defaultSettings
});

export function resetCloudSyncCursor(): void {
  lastCloudUpdatedAt = null;
}

import { useAuthStore, BACKEND_URL } from "../store/authStore";

export async function loadPersistedState(): Promise<PersistedState> {
  // Try loading from local storage first as a starting point
  let localState: PersistedState = emptyState();
  try {
    if (isTauri) {
      const state = await nativeApi.loadLayout();
      if (state) localState = sanitize(state);
    } else {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localState = sanitize(JSON.parse(raw));
    }
  } catch (err) {
    console.warn("Failed to load local state", err);
  }

  // If user has active cloud session, fetch from cloud
  const { token, setSyncStatus, setLastSyncedAt, logout } = useAuthStore.getState();
  if (token) {
    try {
      setSyncStatus("syncing");
      const res = await fetch(`${BACKEND_URL}/api/sync/layout`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const cloudState = await res.json();
        const sanitizedCloud = sanitize(cloudState);
        lastCloudUpdatedAt = typeof cloudState.updated_at === "string" ? cloudState.updated_at : null;
        // Sync local storage cache
        if (isTauri) {
          await nativeApi.saveLayout(sanitizedCloud);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedCloud));
        }
        setSyncStatus("synced");
        setLastSyncedAt(new Date().toLocaleTimeString());
        return sanitizedCloud;
      } else if (res.status === 401) {
        resetCloudSyncCursor();
        logout();
      } else {
        setSyncStatus("error");
      }
    } catch (error) {
      console.warn("Could not load layout from backend, falling back to local layout", error);
      setSyncStatus("offline");
    }
  }

  if (!token) resetCloudSyncCursor();

  return localState;
}

export async function savePersistedState(state: PersistedState): Promise<boolean> {
  const safeState = sanitize(state);
  let localSaveSucceeded = true;
  
  // 1. Save locally instantly
  try {
    if (isTauri) {
      await nativeApi.saveLayout(safeState);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
    }
  } catch (err) {
    console.error("Local save failed", err);
    localSaveSucceeded = false;
  }

  // 2. Sync to cloud if user is logged in
  const { token, setSyncStatus, setLastSyncedAt, logout } = useAuthStore.getState();
  if (!token) return localSaveSucceeded;

  try {
    setSyncStatus("syncing");
    const res = await fetch(`${BACKEND_URL}/api/sync/layout`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        widgets: safeState.widgets,
        settings: safeState.settings,
        updated_at: lastCloudUpdatedAt
      })
    });
    if (res.ok) {
      const savedState = await res.json();
      lastCloudUpdatedAt = typeof savedState.updated_at === "string" ? savedState.updated_at : lastCloudUpdatedAt;
      setSyncStatus("synced");
      setLastSyncedAt(new Date().toLocaleTimeString());
      return localSaveSucceeded;
    } else if (res.status === 401) {
      resetCloudSyncCursor();
      logout();
    } else {
      setSyncStatus("error");
    }
  } catch (error) {
    console.warn("Could not save layout to backend", error);
    setSyncStatus("offline");
  }

  return false;
}

function sanitize(value: PersistedState): PersistedState {
  return {
    version: Number(value.version) || 1,
    widgets: Array.isArray(value.widgets) ? value.widgets : [],
    settings: {
      ...defaultSettings,
      ...(value.settings ?? {}),
      alwaysOnTop: value.settings?.alwaysOnTop ?? defaultSettings.alwaysOnTop,
      skipTaskbar: value.settings?.skipTaskbar ?? defaultSettings.skipTaskbar,
      desktopMode: value.settings?.desktopMode ?? defaultSettings.desktopMode
    }
  };
}
