import type { DesktopWidget } from "../../types/widget";
import { useWidgetStore } from "../../store/widgetStore";

export function NotesWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const text = String(widget.data?.text ?? "");
  return (
    <textarea
      value={text}
      onChange={(event) => updateWidget(widget.id, { data: { ...widget.data, text: event.target.value } })}
      className="h-full w-full resize-none rounded-lg border border-black/10 bg-white/20 p-2 text-sm outline-none focus:ring-2 focus:ring-accent/50 dark:border-white/10 dark:bg-black/10"
    />
  );
}
