import { isTauri, nativeApi } from "./tauri";
import type { DesktopWidget } from "../types/widget";

export type ErrorReporter = (error: any, context: string) => void;

/**
 * Pins a widget to the desktop and opens its corresponding Tauri window.
 */
export async function openWidgetOverlay(
  widget: DesktopWidget,
  updateWidget: (id: string, patch: Partial<DesktopWidget>) => void,
  reportError?: ErrorReporter
): Promise<void> {
  if (!isTauri) return;
  updateWidget(widget.id, { pinned: true, locked: true });
  try {
    await nativeApi.openWidgetWindow(
      widget.id,
      widget.rect.x,
      widget.rect.y,
      widget.rect.width,
      widget.rect.height
    );
  } catch (e) {
    reportError?.(e, `open overlay "${widget.name}"`);
  }
}

/**
 * Unpins a widget from the desktop and closes its corresponding Tauri window.
 */
export async function closeWidgetOverlay(
  widget: DesktopWidget,
  updateWidget: (id: string, patch: Partial<DesktopWidget>) => void,
  reportError?: ErrorReporter
): Promise<void> {
  if (!isTauri) return;
  updateWidget(widget.id, { pinned: false, locked: false });
  try {
    await nativeApi.closeWidgetWindow(widget.id);
  } catch (e) {
    reportError?.(e, `close overlay "${widget.name}"`);
  }
}

/**
 * Toggles a widget's lock state. If pinned, it will unpin and close the overlay window.
 */
export async function toggleWidgetLock(
  widget: DesktopWidget,
  updateWidget: (id: string, patch: Partial<DesktopWidget>) => void,
  reportError?: ErrorReporter
): Promise<void> {
  if (widget.pinned) {
    await closeWidgetOverlay(widget, updateWidget, reportError);
  } else {
    updateWidget(widget.id, { locked: !widget.locked });
  }
}

/**
 * Removes a widget completely and closes its Tauri window if it is open.
 */
export async function deleteWidget(
  widget: DesktopWidget,
  removeWidget: (id: string) => void,
  reportError?: ErrorReporter
): Promise<void> {
  removeWidget(widget.id);
  try {
    await nativeApi.closeWidgetWindow(widget.id);
  } catch (e) {
    reportError?.(e, `close overlay "${widget.name}"`);
  }
}
