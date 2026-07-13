import { listen, emit } from "@tauri-apps/api/event";
import { isTauri } from "./tauri";
import { useWidgetStore } from "../store/widgetStore";
import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import type { DesktopWidget, AppSettings } from "../types/widget";

let isSyncingWidgets = false;
let isSyncingSettings = false;

interface AuthSessionPayload {
  token: string | null;
  email: string | null;
}

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

  // Tauri creates floating widgets in separate WebViews, so their Zustand
  // stores and localStorage are not guaranteed to contain the main window's
  // auth session. Keep the session synchronized without putting the token in
  // the widget URL.
  if (isWidgetWindow) {
    void listen<AuthSessionPayload>("auth-session-sync", (event) => {
      const auth = useAuthStore.getState();
      if (event.payload.token && event.payload.email) {
        auth.setSession(event.payload.token, event.payload.email, "oauth");
      } else if (auth.token) {
        auth.logout();
      }
    }).then(() => emit("auth-session-request")).catch(() => undefined);
  } else {
    void listen("auth-session-request", () => {
      const auth = useAuthStore.getState();
      auth.initialize();
      void emit("auth-session-sync", { token: auth.token, email: auth.email }).catch(() => undefined);
    });

    let previousSessionVersion = useAuthStore.getState().sessionVersion;
    useAuthStore.subscribe((state) => {
      if (state.sessionVersion === previousSessionVersion) return;
      previousSessionVersion = state.sessionVersion;
      void emit("auth-session-sync", { token: state.token, email: state.email }).catch(() => undefined);
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
