import { listen, emit } from "@tauri-apps/api/event";
import { isTauri } from "./tauri";
import { useWidgetStore } from "../store/widgetStore";
import { useSettingsStore } from "../store/settingsStore";
import { useAiProviderStore, type AiProviderSettings } from "../store/aiProviderStore";
import type { DesktopWidget, AppSettings } from "../types/widget";

let isSyncingWidgets = false;
let isSyncingSettings = false;

export function initializeStoreSync() {
  if (!isTauri) return;

  const isWidgetWindow = Boolean(new URLSearchParams(window.location.search).get("widget"));

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

  if (isWidgetWindow) {
    void listen<AiProviderSettings>("ai-provider-settings-sync", (event) => {
      useAiProviderStore.getState().syncSettings(event.payload);
    }).then(() => emit("ai-provider-settings-request")).catch(() => undefined);
  } else {
    void listen("ai-provider-settings-request", () => {
      void emit("ai-provider-settings-sync", {
        baseUrl: useAiProviderStore.getState().baseUrl,
        model: useAiProviderStore.getState().model,
        maxTokens: useAiProviderStore.getState().maxTokens,
        temperature: useAiProviderStore.getState().temperature,
        timeoutSeconds: useAiProviderStore.getState().timeoutSeconds,
      }).catch(() => undefined);
    });

    let previousAiSettings = useAiProviderStore.getState();
    useAiProviderStore.subscribe((state) => {
      if (state.baseUrl === previousAiSettings.baseUrl && state.model === previousAiSettings.model && state.maxTokens === previousAiSettings.maxTokens && state.temperature === previousAiSettings.temperature && state.timeoutSeconds === previousAiSettings.timeoutSeconds) return;
      previousAiSettings = state;
      void emit("ai-provider-settings-sync", {
        baseUrl: state.baseUrl,
        model: state.model,
        maxTokens: state.maxTokens,
        temperature: state.temperature,
        timeoutSeconds: state.timeoutSeconds,
      }).catch(() => undefined);
    });
  }

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
