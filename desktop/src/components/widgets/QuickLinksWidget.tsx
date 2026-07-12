import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import type { DesktopWidget } from "../../types/widget";
import { useWidgetStore } from "../../store/widgetStore";

export function QuickLinksWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const links = ((widget.data?.links as { label: string; url: string }[]) ?? []);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const newLink = { label: newLabel.trim(), url: formattedUrl };
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        links: [...links, newLink]
      }
    });
    setNewLabel("");
    setNewUrl("");
    setIsAdding(false);
  };

  const removeLink = (url: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        links: links.filter((link) => link.url !== url)
      }
    });
  };

  return (
    <div className="flex h-full flex-col justify-between space-y-2">
      <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
        {links.length === 0 ? (
          <p className="text-sm text-muted">No links yet.</p>
        ) : (
          links.map((link) => (
            <div key={link.url} className="flex items-center justify-between gap-2 rounded-lg bg-black/5 px-3 py-1.5 hover:bg-black/10 dark:bg-white/10 group/link">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-between text-sm min-w-0">
                <span className="truncate pr-2 font-medium">{link.label}</span>
                <ExternalLink size={12} className="text-muted shrink-0" />
              </a>
              <button
                onClick={(e) => { e.preventDefault(); removeLink(link.url); }}
                className="hidden shrink-0 text-red-500 hover:text-red-700 group-hover/link:block p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-black/10 dark:border-white/10 shrink-0">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-black/5 py-1 text-xs font-semibold hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Plus size={13} /> Add Link
          </button>
        ) : (
          <form onSubmit={addLink} className="space-y-1.5 bg-black/5 p-2 rounded-lg dark:bg-white/5">
            <input
              type="text"
              placeholder="Label (e.g. Google)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-white/50 px-2 py-1 text-xs outline-none focus:border-accent dark:border-white/10 dark:bg-black/10"
            />
            <input
              type="text"
              placeholder="URL (e.g. google.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-white/50 px-2 py-1 text-xs outline-none focus:border-accent dark:border-white/10 dark:bg-black/10"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded px-2 py-1 text-[10px] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-accent px-2.5 py-1 text-[10px] font-semibold text-white hover:brightness-110"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

