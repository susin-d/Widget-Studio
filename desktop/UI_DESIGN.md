# Desktop Widgets — UI Design Specification

Exported: 12 July 2026

## Design Direction

A playful Windows 11-inspired desktop utility combining soft acrylic surfaces, colorful ambient gradients, rounded geometry, and compact productivity controls. The editor should feel expressive without competing with the widgets being configured.

---

## Main Editor Layout

```text
┌──────────────────┬──────────────────────────────────────────────┬───────────────────┐
│                  │  Widget control center                       │                   │
│  WIDGET LIBRARY  │  [Select] [Open all] [Hide all] [Reset]     │    INSPECTOR      │
│                  ├──────────────────────────────────────────────┤                   │
│  + Clock         │  [Name] [Show] [Hide] [Lock] [Copy]         │  Name + status    │
│  + Weather       │  [Glass] [Auto] [Color] [W] [H] [Delete]    │                   │
│  + Todo          ├──────────────────────────────────────────────┤  Actions          │
│  + Notes         │                                              │  Appearance       │
│  + System        │       DRAGGABLE WIDGET CANVAS                │  Layout           │
│  + Quick Links   │                                              │  Widget controls  │
│  + Calendar      │       ┌──────────────┐                       │                   │
│                  │       │ Widget card  │                       │                   │
│  ACTIVE WIDGETS  │       └──────────────◪                       │                   │
│                  │                      └ Drag handle           │                   │
│  Settings        │                                              │                   │
└──────────────────┴──────────────────────────────────────────────┴───────────────────┘
```

### Layout Regions

| Region | Width | Purpose |
|---|---:|---|
| Widget Library | 288 px | Create widgets, manage active instances, access settings panels |
| Canvas | Flexible | Arrange, select, and interact with widgets |
| Inspector | 320 px | Modify parameters of the selected widget |
| Control Center | Canvas width minus 32 px | Quick action bar for renaming, showing, locking, copying, and deleting |

---

## Visual Language

- **Shape**:
  - Primary panels: 16–18 px corner radius.
  - Buttons and inputs: 8 px corner radius.
  - Theme cards: 16 px corner radius.
  - Widgets: Configurable corners from 0 to 32 px.
  - Resizing: Drag handle sits in the bottom-right corner of unlocked widgets (`◪`). Context-menu pre-set sizing options are removed in favor of fully customized manual dragging.
- **Elevation**:
  - Translucent acrylic panel colors with backdrop blur (`backdrop-filter`).
  - Ambient color circles sit behind the canvas.
  - User-configurable shadow intensities.

---

## Color Tokens

- `surface`: Background color.
- `panel`: Cards, control center, and sidebar surfaces.
- `text` / `muted`: Foreground and helper texts.
- `accent`: Primary interactions and highlights.
- `accent-2` / `accent-3`: Theme gradient layers.
- `widget-tint`: Custom override background colors for individual widgets.

---

## Custom Widget UI Specifications

Here are the specifications for the newly added widgets:

### 🍅 Pomodoro Widget
- **Interface**: Centered countdown timer with large typography. A visual SVG circular progress ring that empties/fills as time goes down.
- **Controls**: Inline Play/Pause, Skip, Reset, and Focus/Break duration config controls.
- **Micro-Animations**: Progress ring updates smoothly. The card background flashes a soft pulse upon timer completion.

### 🧮 Calculator Widget
- **Interface**: Upper digital output screen showing current query, a side history tape displaying previous results, and a standard \(4 \times 5\) button grid.
- **Colors**: Standard operations are color-themed, secondary keys use muted buttons.

### 📌 Sticky Notepad
- **Interface**: Post-it style cards with multiple yellow, pink, blue, green, and orange pastel backgrounds.
- **Controls**: Editable header, bullet list support, and text formatting.

### 🧠 Mindmap Widget
- **Interface**: Interactive canvas container. Nodes are rendered as pill buttons. Branches connect dynamically via custom SVG paths.
- **Controls**: "+" buttons on nodes to branch out, double-click to edit labels, and trash-bin icons to prune subtrees.

### 🌐 Custom Widget
- **Interface**: Seamless iframe container that loads and executes web applications or media blocks.
- **Controls**: Input bar for URLs, toggle switches for scrollbars, sandboxing options, and CSS code input overlays.

---

## Interaction Behavior

| Interaction | Response |
|---|---|
| Mouse Drag | Relocates widget across grid lines (12px snapping is optional). |
| Drag Resize Handle | Adjusts layout bounds dynamically; context menu sizing options are omitted. |
| Lock Toggle | Disables drag/resize handlers, turning off card borders. |
| Pin Overlay | Opens a separate borderless window and displays the widget directly on the Windows desktop. |
| Unpin Overlay | Closes the Tauri desktop window and restores the widget inside the editor's workspace at its exact coordinates. |
