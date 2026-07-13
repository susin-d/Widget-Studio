import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Search, X } from "lucide-react";
import type { ReactNode, KeyboardEvent } from "react";
import { managerNavigationItems, type ManagerView } from "./ManagerNavigation";
import { widgetGallery } from "./WidgetGallery";
import type { DesktopWidget, WidgetKind } from "../../types/widget";

type PaletteItem = {
  id: string;
  label: string;
  description: string;
  category: "Navigate" | "Add widget" | "Open widget";
  keywords: string;
  icon: ReactNode;
  run: () => void;
};

interface CommandPaletteProps {
  widgets: DesktopWidget[];
  onClose: () => void;
  onView: (view: ManagerView) => void;
  onCreateWidget: (type: WidgetKind) => void;
  onOpenWidget: (id: string) => void;
}

export function CommandPalette({ widgets, onClose, onView, onCreateWidget, onOpenWidget }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = useMemo<PaletteItem[]>(() => [
    ...managerNavigationItems.map((item) => ({
      id: `view-${item.id}`,
      label: item.label,
      description: `Open ${item.label.toLowerCase()}`,
      category: "Navigate" as const,
      keywords: "page section navigation",
      icon: item.icon,
      run: () => onView(item.id)
    })),
    ...widgetGallery.map((item) => ({
      id: `add-${item.type}`,
      label: `Add ${item.label}`,
      description: "Create a widget on the canvas",
      category: "Add widget" as const,
      keywords: `${item.label} ${item.type} new create widget canvas`,
      icon: item.icon,
      run: () => onCreateWidget(item.type)
    })),
    ...widgets.map((widget) => ({
      id: `open-${widget.id}`,
      label: widget.name,
      description: `${widget.pinned ? "Pinned" : "Canvas"} ${widget.type} widget`,
      category: "Open widget" as const,
      keywords: `${widget.name} ${widget.type} ${widget.pinned ? "pinned overlay" : "canvas"}`,
      icon: <Boxes size={16} />,
      run: () => onOpenWidget(widget.id)
    }))
  ], [onCreateWidget, onOpenWidget, onView, widgets]);

  const filteredItems = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return items;

    return items.filter((item) => {
      const searchable = `${item.label} ${item.description} ${item.keywords}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    setSelectedIndex((index) => Math.min(index, Math.max(0, filteredItems.length - 1)));
  }, [filteredItems.length]);

  const groupedItems = useMemo(() => filteredItems.reduce<Record<string, PaletteItem[]>>((groups, item) => {
    (groups[item.category] ??= []).push(item);
    return groups;
  }, {}), [filteredItems]);

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;
    item.run();
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => filteredItems.length ? (index + 1) % filteredItems.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => filteredItems.length ? (index - 1 + filteredItems.length) % filteredItems.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      runItem(filteredItems[selectedIndex]);
    }
  };

  const selectedItem = filteredItems[selectedIndex];

  return (
    <div className="command-backdrop" onPointerDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="command-search-row">
          <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            role="combobox"
            aria-label="Search pages, widgets, and actions"
            aria-controls="command-results"
            aria-expanded="true"
            aria-activedescendant={selectedItem ? `command-result-${selectedItem.id}` : undefined}
            placeholder="Search pages, widgets, or actions…"
          />
          {query && (
            <button type="button" className="command-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
          <kbd>Esc</kbd>
        </div>

        <div id="command-results" className="command-results" role="listbox" aria-label="Search results">
          {filteredItems.length === 0 ? (
            <div className="command-empty">
              <Search size={20} aria-hidden="true" />
              <strong>No matches found</strong>
              <span>Try a page name, widget type, or action.</span>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="command-group">
                <div className="command-group-label">{category}</div>
                {categoryItems.map((item) => {
                  const index = filteredItems.indexOf(item);
                  const selected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      id={`command-result-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`command-result ${selected ? "is-selected" : ""}`}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="command-result-icon">{item.icon}</span>
                      <span className="command-result-copy">
                        <span className="command-result-label">{item.label}</span>
                        <span className="command-result-description">{item.description}</span>
                      </span>
                      <ArrowRight size={14} className="command-result-arrow" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <footer className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
          <span className="ml-auto">{filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}</span>
        </footer>
      </section>
    </div>
  );
}
