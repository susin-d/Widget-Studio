import { listen, emit } from "@tauri-apps/api/event";
import { isTauri } from "./tauri";
import { useWidgetStore } from "../store/widgetStore";
import { useSettingsStore } from "../store/settingsStore";
import type { DesktopWidget, AppSettings } from "../types/widget";

let isSyncingWidgets = false;
let isSyncingSettings = false;

export function initializeStoreSync() {
  if (!isTauri) return;

  // 1. Listen for updates from other windows
  void listen<DesktopWidget[]>("widgets-sync", (event) => {
    isSyncingWidgets = true;
    useWidgetStore.getState().syncWidgets(event.payload);
    isSyncingWidgets = false;
  });

  void listen<AppSettings>("settings-sync", (event) => {
    isSyncingSettings = true;
    useSettingsStore.getState().syncSettings(event.payload);
    isSyncingSettings = false;
  });

  // 2. Subscribe to local store changes and emit to other windows
  let prevWidgets = useWidgetStore.getState().widgets;
  useWidgetStore.subscribe((state) => {
    if (isSyncingWidgets) return;
    if (state.widgets === prevWidgets) return;
    prevWidgets = state.widgets;

    void emit("widgets-sync", state.widgets).catch(() => undefined);
  });

  let prevSettings = useSettingsStore.getState().settings;
  useSettingsStore.subscribe((state) => {
    if (isSyncingSettings) return;
    if (state.settings === prevSettings) return;
    prevSettings = state.settings;

    void emit("settings-sync", state.settings).catch(() => undefined);
  });
}
