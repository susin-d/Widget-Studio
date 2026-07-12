import { create } from "zustand";
import type { AppSettings } from "../types/widget";
import { defaultSettings } from "../lib/storage";
import { nativeApi } from "../lib/tauri";

interface SettingsStore {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  syncSettings: (settings: AppSettings) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) => {
    set((state) => ({ settings: { ...state.settings, [key]: value } }));
    if (key === "alwaysOnTop") void nativeApi.setAlwaysOnTop(Boolean(value)).catch(() => undefined);
    if (key === "skipTaskbar") void nativeApi.setSkipTaskbar(Boolean(value)).catch(() => undefined);
    if (key === "desktopMode") void nativeApi.setDesktopMode(Boolean(value)).catch(() => undefined);
    if (key === "launchOnStartup") void nativeApi.setStartup(Boolean(value)).catch(() => undefined);
  },
  syncSettings: (settings) => set({ settings })
}));
