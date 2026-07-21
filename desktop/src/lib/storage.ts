import type { AppSettings, PersistedState } from "../types/widget";
import { nativeApi, isTauri } from "./tauri";
import { useAuthStore, BACKEND_URL } from "../store/authStore";

const STORAGE_KEY = "desktop-widgets-state";
const CLOUD_REQUEST_TIMEOUT_MS = 15_000;
let lastCloudUpdatedAt: string | null = null;
let cloudSyncInFlight: Promise<boolean> | null = null;
let cloudSyncQueuedState: PersistedState | null = null;

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
  batterySaverAutomation: true,
  focusHoursAutomation: false,
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

export async function loadLocalPersistedState(): Promise<PersistedState> {
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

  return localState;
}

export async function saveLocalPersistedState(state: PersistedState): Promise<boolean> {
  const safeState = sanitize(state);
  try {
    if (isTauri) {
      await nativeApi.saveLayout(safeState);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
    }
  } catch (err) {
    console.error("Local save failed", err);
    return false;
  }
  return true;
}

export async function loadPersistedState(): Promise<PersistedState> {
  return loadLocalPersistedState();
}

export async function savePersistedState(state: PersistedState): Promise<boolean> {
  return saveLocalPersistedState(state);
}

export async function syncPersistedStateToCloud(_state: PersistedState): Promise<boolean> {
  return true;
}

async function syncPersistedStateToCloudOnce(state: PersistedState): Promise<boolean> {
  const safeState = sanitize(state);

  const { token, setSyncStatus, setLastSyncedAt, logout } = useAuthStore.getState();
  if (!token) return true;

  try {
    setSyncStatus("syncing");
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/sync/layout`, {
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
      return true;
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

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLOUD_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
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
