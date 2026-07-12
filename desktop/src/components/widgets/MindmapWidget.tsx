import { useState } from "react";
import { Plus, Trash2, Edit, Check, X, GitCommit } from "lucide-react";
import { useWidgetStore } from "../../store/widgetStore";
import type { DesktopWidget } from "../../types/widget";

interface MindmapNode {
  id: string;
  text: string;
  children: MindmapNode[];
}

export function MindmapWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const root = (widget.data?.root as MindmapNode) || {
    id: "root",
    text: "Central Idea",
    children: [],
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const saveTree = (newRoot: MindmapNode) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        root: newRoot,
      },
    });
  };

  // Helper to deep clone the tree and run an operation on a node
  const updateNodeInTree = (
    node: MindmapNode,
    targetId: string,
    operation: (n: MindmapNode) => void
  ): MindmapNode => {
    const clone = { ...node, children: [...node.children] };
    if (clone.id === targetId) {
      operation(clone);
      return clone;
    }
    clone.children = clone.children.map((child) =>
      updateNodeInTree(child, targetId, operation)
    );
    return clone;
  };

  const handleAddChild = (parentId: string) => {
    const newId = `node-${Date.now()}`;
    const newRoot = updateNodeInTree(root, parentId, (node) => {
      node.children.push({
        id: newId,
        text: "New Topic",
        children: [],
      });
    });
    saveTree(newRoot);
    setSelectedNodeId(newId);
    setEditingNodeId(newId);
    setEditText("New Topic");
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === "root") return; // cannot delete root
    
    // Find parent of nodeId and remove nodeId from its children
    const removeNode = (node: MindmapNode): MindmapNode => {
      return {
        ...node,
        children: node.children
          .filter((c) => c.id !== nodeId)
          .map(removeNode),
      };
    };

    const newRoot = removeNode(root);
    saveTree(newRoot);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setEditingNodeId(null);
    }
  };

  const handleStartEdit = (node: MindmapNode) => {
    setEditingNodeId(node.id);
    setEditText(node.text);
  };

  const handleSaveEdit = (nodeId: string) => {
    if (!editText.trim()) return;
    const newRoot = updateNodeInTree(root, nodeId, (node) => {
      node.text = editText.trim();
    });
    saveTree(newRoot);
    setEditingNodeId(null);
  };

  // Render a node and its children recursively in a clean column/tree layout
  const renderTree = (node: MindmapNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;

    return (
      <div key={node.id} className="flex flex-col">
        {/* Node container */}
        <div className="flex items-center gap-2 py-1">
          {/* Indent spacing with connected guidelines */}
          {depth > 0 && (
            <div className="flex items-center" style={{ width: `${depth * 16}px` }}>
              <div className="h-full border-l border-dashed border-muted/30 ml-auto mr-2" />
              <GitCommit size={12} className="text-accent/60" />
            </div>
          )}

          {/* Node bubble */}
          <div
            onClick={() => {
              setSelectedNodeId(node.id);
              if (editingNodeId !== node.id) {
                setEditingNodeId(null);
              }
            }}
            className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-2.5 py-1 text-xs transition duration-200 ${
              isSelected
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text/90"
            }`}
          >
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none border-b border-white/40 text-inherit w-24 py-0.5"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(node.id);
                    if (e.key === "Escape") setEditingNodeId(null);
                  }}
                />
                <button onClick={() => handleSaveEdit(node.id)} className="hover:text-white/80">
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingNodeId(null)} className="hover:text-white/80">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="font-medium truncate max-w-[120px]">{node.text}</span>
            )}
          </div>

          {/* Mini-controls on selection */}
          {isSelected && !isEditing && (
            <div className="flex items-center gap-1 rounded-md bg-panel border border-black/10 dark:border-white/10 p-0.5 shadow-sm">
              <button
                title="Add Topic"
                onClick={() => handleAddChild(node.id)}
                className="rounded p-0.5 text-text/75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent"
              >
                <Plus size={12} />
              </button>
              <button
                title="Rename"
                onClick={() => handleStartEdit(node)}
                className="rounded p-0.5 text-text/75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent"
              >
                <Edit size={11} />
              </button>
              {node.id !== "root" && (
                <button
                  title="Delete"
                  onClick={() => handleDeleteNode(node.id)}
                  className="rounded p-0.5 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Children container */}
        {node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col p-1.5 select-none overflow-auto">
      <div className="flex-1 min-h-0 min-w-0 pr-2">
        {renderTree(root)}
      </div>
      <div className="mt-2 text-[10px] text-muted flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-1.5 px-0.5">
        <span>Click node to select/edit</span>
        {selectedNodeId && (
          <button
            onClick={() => setSelectedNodeId(null)}
            className="hover:text-accent font-medium"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
