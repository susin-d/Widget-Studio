import type { AppSettings, PersistedState } from "../types/widget";
import { nativeApi, isTauri } from "./tauri";

const STORAGE_KEY = "desktop-widgets-state";

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
