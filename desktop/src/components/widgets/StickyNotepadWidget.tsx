import { useState } from "react";
import { Plus, Trash2, Search, Edit } from "lucide-react";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget } from "../../types/widget";

interface StickyNoteItem {
  id: string;
  title: string;
  content: string;
  color: string; // Tailwind bg- classes
}

const NOTE_COLORS = [
  { bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-300", label: "Yellow" },
  { bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-300", label: "Blue" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300", label: "Green" },
  { bg: "bg-rose-100 dark:bg-rose-950/40 border-rose-300", label: "Pink" },
  { bg: "bg-purple-100 dark:bg-purple-950/40 border-purple-300", label: "Purple" }
];

export function StickyNotepadWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const notes = (widget.data?.notes as StickyNoteItem[]) || [];

  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id ?? null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].bg);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreateNote = () => {
    const newNote: StickyNoteItem = {
      id: `note-${Date.now()}`,
      title: "New note",
      content: "",
      color: selectedColor
    };
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        notes: [newNote, ...notes]
      }
    });
    setSelectedNoteId(newNote.id);
    setEditingTitle("New note");
    setEditingContent("");
  };

  const handleUpdateNote = (id: string, patch: Partial<StickyNoteItem>) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        notes: updated
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notes.filter((n) => n.id !== id);
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        notes: filtered
      }
    });
    if (selectedNoteId === id) {
      setSelectedNoteId(filtered[0]?.id ?? null);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col p-2 select-none">
      {/* Search & Add */}
      <div className="flex gap-2 mb-2 items-center">
        <div className="flex-1 flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
          <Search size={12} className="text-muted mr-1.5" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent outline-none placeholder:text-muted"
          />
        </div>
        <button
          onClick={handleCreateNote}
          className="rounded-lg bg-accent text-white p-1.5 flex items-center justify-center shadow-md shadow-accent/20 hover:scale-[1.03]"
          title="Create note"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Editor & List Split */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Note Area */}
          <div className={`flex-1 rounded-xl p-2.5 border flex flex-col ${selectedNote.color}`}>
            <input
              type="text"
              value={selectedNote.title}
              onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
              className="bg-transparent text-xs font-bold outline-none border-b border-black/10 dark:border-white/10 pb-1 text-black dark:text-white"
              placeholder="Title"
            />
            <textarea
              value={selectedNote.content}
              onChange={(e) => handleUpdateNote(selectedNote.id, { content: e.target.value })}
              className="flex-1 bg-transparent text-[11px] outline-none resize-none pt-2 text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
              placeholder="Start writing..."
            />
          </div>

          {/* Color & Controls Bar */}
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 dark:border-white/5">
            <div className="flex gap-1">
              {NOTE_COLORS.map((c) => {
                const active = selectedNote.color === c.bg;
                return (
                  <button
                    key={c.bg}
                    onClick={() => handleUpdateNote(selectedNote.id, { color: c.bg })}
                    className={`w-3.5 h-3.5 rounded-full border transition hover:scale-110 ${c.bg} ${
                      active ? "ring-2 ring-accent border-white" : "border-black/10 dark:border-white/10"
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedNoteId(null)}
                className="text-[10px] text-muted hover:text-text font-medium"
              >
                Back to list
              </button>
              <button
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="text-red-500 hover:text-red-700"
                title="Delete note"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              onClick={() => setSelectedNoteId(n.id)}
              className={`rounded-lg p-2 border cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm ${n.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black dark:text-white truncate">{n.title || "Untitled"}</span>
                <span className="text-[9px] text-black/60 dark:text-white/60">Edit</span>
              </div>
              <p className="text-[10px] text-black/80 dark:text-white/80 line-clamp-2 mt-0.5">
                {n.content || "Empty content..."}
              </p>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-xs text-muted">No notes found.</div>
          )}
        </div>
      )}
    </div>
  );
}
