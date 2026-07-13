import { invoke } from "@tauri-apps/api/core";
import type { PersistedState } from "../types/widget";
import { getCurrentWindow } from "@tauri-apps/api/window";

export interface SystemInfo {
  cpu_usage: number;
  ram_used: number;
  ram_total: number;
  battery_level?: number | null;
}

export const isTauri = "__TAURI_INTERNALS__" in window;

export async function callTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    throw new Error(`Tauri command '${command}' is unavailable in browser preview.`);
  }
  return invoke<T>(command, args);
}

export const nativeApi = {
  minimize: () => getCurrentWindow().minimize(),
  toggleMaximize: () => getCurrentWindow().toggleMaximize(),
  close: () => getCurrentWindow().close(),
  saveLayout: (state: PersistedState) => callTauri<void>("save_layout", { state }),
  loadLayout: () => callTauri<PersistedState | null>("load_layout"),
  setStartup: (enabled: boolean) => callTauri<void>("set_startup", { enabled }),
  getSystemInfo: () => callTauri<SystemInfo>("get_system_info"),
  showWindow: () => callTauri<void>("show_window"),
  hideWindow: () => callTauri<void>("hide_window"),
  setAlwaysOnTop: (enabled: boolean) => callTauri<void>("set_always_on_top", { enabled }),
  setSkipTaskbar: (enabled: boolean) => callTauri<void>("set_skip_taskbar", { enabled }),
  setDesktopMode: (enabled: boolean) => callTauri<void>("set_desktop_mode", { enabled }),
  openWidgetWindow: (id: string, x: number, y: number, width: number, height: number) =>
    callTauri<void>("open_widget_window", { id, x, y, width, height }),
  closeWidgetWindow: (id: string) => callTauri<void>("close_widget_window", { id }),
  setWindowSize: (width: number, height: number) => callTauri<void>("set_window_size", { width, height }),
  setWindowPosition: (x: number, y: number) => callTauri<void>("set_window_position", { x, y }),
  copyToClipboard: (text: string) => callTauri<void>("copy_to_clipboard", { text }),
  openUninstallSettings: () => callTauri<void>("open_uninstall_settings")
};
