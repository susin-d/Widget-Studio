import type { Update } from "@tauri-apps/plugin-updater";
import { isTauri } from "./tauri";

export type UpdateProgressHandler = (progress: number) => void;

export async function checkForUpdates(): Promise<Update | null> {
  if (!isTauri) return null;

  const { check } = await import("@tauri-apps/plugin-updater");
  return check({ timeout: 15_000 });
}

export async function installUpdate(update: Update, onProgress: UpdateProgressHandler): Promise<void> {
  const { relaunch } = await import("@tauri-apps/plugin-process");
  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    if (event.event === "Started") {
      contentLength = event.data.contentLength ?? 0;
      onProgress(0);
      return;
    }

    if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      if (contentLength > 0) {
        onProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
      }
      return;
    }

    if (event.event === "Finished") onProgress(100);
  });

  await relaunch();
}
