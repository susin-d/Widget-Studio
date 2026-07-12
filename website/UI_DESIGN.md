# Desktop Widgets — UI Design Specification

Exported: 12 July 2026

## Design direction

A playful Windows 11-inspired desktop utility combining soft acrylic surfaces, colorful ambient gradients, rounded geometry, and compact productivity controls. The editor should feel expressive without competing with the widgets being configured.

## Main editor layout

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
│  ACTIVE WIDGETS  │       └──────────────┘                       │                   │
│                  │                                              │                   │
│  Settings        │                                              │                   │
└──────────────────┴──────────────────────────────────────────────┴───────────────────┘
```

### Layout regions

| Region | Width | Purpose |
|---|---:|---|
| Widget library | 288 px | Create widgets, manage active instances, open Settings |
| Canvas | Flexible | Arrange, select, resize, and preview widgets |
| Inspector | 320 px | Detailed controls for the selected widget |
| Control center | Canvas width minus 32 px | Primary global and selected-widget commands |

The control center is inset 16 px from the canvas edges. Widgets begin below it and remain freely draggable within the editing surface.

## Visual language

### Shape

- Primary panels: 16–18 px corner radius
- Buttons and inputs: 8 px corner radius
- Theme cards: 16 px corner radius
- Widget radius: configurable from 0–32 px
- Scrollbar thumb: fully rounded

### Spacing

- Base unit: 4 px
- Tight gaps: 4–8 px
- Control gaps: 8–12 px
- Panel padding: 16–20 px
- Major section separation: 20 px

### Typography

- Font: Segoe UI Variable, Segoe UI, system sans-serif
- Page title: 18–20 px, semibold
- Widget time/display: 36–48 px, semibold or extra-light depending on mode
- Body/control text: 14 px
- Supporting text: 12 px
- Section labels: 11–12 px, semibold, uppercase, increased tracking

### Elevation and material

- Editor panels use translucent panel colors with backdrop blur.
- Widget cards use acrylic, solid, or transparent material.
- Selected widgets receive a 2 px accent ring and surface-colored offset.
- Ambient color circles and gradients sit behind the canvas content.
- Shadows remain soft and broad, with user-configurable strength.

## Color tokens

| Token | Purpose |
|---|---|
| `surface` | Main application background |
| `panel` | Sidebar, inspector, settings, and toolbar surfaces |
| `text` | Primary readable content |
| `muted` | Metadata, descriptions, and secondary controls |
| `accent` | Primary actions, focus, selection, meters |
| `accent-2` | Gradient and ambient secondary color |
| `accent-3` | Decorative tertiary color |
| `canvas-a` / `canvas-b` | Theme atmosphere |
| `widget-tint` | Per-widget custom color |

## App themes

| Theme | Primary | Secondary | Highlight | Character |
|---|---|---|---|---|
| Berry Pop | `#FF4F87` | `#8B5CF6` | `#FFD166` | Bright, warm, playful |
| Citrus Splash | `#F97316` | `#FACC15` | `#22C55E` | Energetic and fresh |
| Ocean Candy | `#06B6D4` | `#3B82F6` | `#FB7185` | Cool with a sweet contrast |
| Lavender Dream | `#A855F7` | `#EC4899` | `#818CF8` | Soft and imaginative |
| Mint Sorbet | `#10B981` | `#5EEAD4` | `#FDA4AF` | Calm and refreshing |
| Midnight Neon | `#8B5CF6` | `#22D3EE` | `#F472B6` | Dark, vivid, futuristic |

Every theme supports system, light, and dark brightness modes. Users may override the main accent and assign an independent color to each widget.

## Component design

### Buttons

- Primary: solid accent background, white text
- Ghost: subtle neutral fill that increases on hover
- Danger: translucent red background with red text
- Disabled: 50% opacity and blocked cursor
- Minimum height: 36 px
- Icons: 14–16 px, placed before the label

### Inputs

- Compact 36 px height
- Translucent panel fill
- Subtle neutral border
- Accent border or ring on focus
- Number fields use short widths in the control center and full widths in the inspector

### Theme cards

- Emoji marker
- Theme name
- Three-color palette strip
- Selected state uses an accent border, soft accent fill, and check indicator
- Hover state lifts the card slightly and adds a widget shadow

### Widget card

```text
┌─────────────────────────────────┐
│ Widget name                  📌 │
│                                 │
│          Widget content         │
│                                 │
│                 duplicate/open  │
│                 lock/delete     │
└───────────────────────────────◢─┘
```

- Header contains editable name and pin state.
- Hover reveals management actions.
- Bottom-right handle resizes unlocked cards.
- Custom tint affects glass and solid materials.
- Desktop mode removes editor chrome and adds a compact move handle.

### Custom scrollbar

- 10 px width
- Translucent panel track
- Rounded gradient thumb using primary and secondary accents
- Two-pixel panel-colored inset border
- Solid accent on hover
- Firefox uses the closest supported thin scrollbar treatment

## Interaction behavior

| Interaction | Response |
|---|---|
| Select widget | Accent ring appears; control center and Inspector populate |
| Drag widget | Position updates; optional 12 px grid snapping applies |
| Resize widget | Minimum canvas size enforced; dimensions persist |
| Show widget | Creates an independent transparent desktop window |
| Hide widget | Closes desktop window and unlocks canvas instance |
| Lock widget | Prevents canvas dragging and resizing |
| Unpin and unlock | Closes desktop overlay and restores canvas editing |
| Duplicate | Creates an offset copy with the same data and appearance |
| Change theme | Canvas atmosphere and application accents update immediately |
| Change widget color | Only the selected widget material changes |
| Three-finger show desktop | Pinned widgets automatically restore |

## Empty and system states

- First launch: centered welcome card with a single “Start customizing” action.
- Empty canvas: centered explanation directing users to the widget library.
- No selection: Inspector explains how to select a widget; control center requests selection.
- Offline weather: shows an explicit offline preview instead of failing.
- Browser-only system monitor: explains that native information requires Tauri.
- Disabled global actions: visually dimmed when no widgets exist.

## Accessibility

- All icon-only actions require titles or accessible labels.
- Text and controls use semantic foreground tokens for light/dark contrast.
- Keyboard activation is supported for active-widget action controls.
- Focus should remain clearly visible through accent borders or rings.
- Color is supported by icons, labels, and checkmarks rather than used as the only state signal.

## Responsive behavior

- Control-center rows wrap rather than overflow.
- Sidebar and Inspector retain fixed editing widths on the current desktop target.
- Long widget names truncate in the active list.
- Scrollable side panels keep their footer actions visible.
- The editor targets a minimum practical width near 1100 px; a future compact mode should collapse the Inspector into a drawer below that width.
