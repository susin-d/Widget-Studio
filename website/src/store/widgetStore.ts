import { create } from "zustand";
import type { DesktopWidget, PersistedState, WidgetKind, WidgetRect, WidgetSettings } from "../types/widget";
import { defaultSettings } from "../lib/storage";
import { useSettingsStore } from "./settingsStore";

const widgetNames: Record<WidgetKind, string> = {
  clock: "Clock",
  weather: "Weather",
  todo: "Todo",
  notes: "Notes",
  system: "System Monitor",
  links: "Quick Links",
  calendar: "Calendar",
  custom: "Custom Widget",
  mindmap: "Mindmap",
  pomodoro: "Focus Timer",
  worldclock: "World Clock",
  stickynotes: "Sticky Notepad",
  calculator: "Calculator",
  chatbot: "AI Chatbot"
};

interface WidgetStore {
  widgets: DesktopWidget[];
  past: DesktopWidget[][];
  future: DesktopWidget[][];
  hydrated: boolean;
  setWidgets: (widgets: DesktopWidget[]) => void;
  hydrate: (state: PersistedState) => void;
  addWidget: (type: WidgetKind, options?: { pinned?: boolean; rect?: Partial<WidgetRect> }) => DesktopWidget;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  updateWidget: (id: string, patch: Partial<DesktopWidget>) => void;
  updateRect: (id: string, rect: Partial<WidgetRect>) => void;
  updateSettings: (id: string, settings: Partial<WidgetSettings>) => void;
  undo: () => void;
  redo: () => void;
  syncWidgets: (widgets: DesktopWidget[]) => void;
}

const history=(state:WidgetStore,next:DesktopWidget[])=>({widgets:next,past:[...state.past.slice(-49),structuredClone(state.widgets)],future:[]});

export const defaultWidgetSettings = (): WidgetSettings => ({
  opacity: 0.86,
  background: defaultSettings.widgetBackground,
  radius: defaultSettings.cornerRadius,
  theme: "system",
  fontSize: 16,
  refreshInterval: 60
});

export function createWidget(type: WidgetKind, index = 0, options: { pinned?: boolean; rect?: Partial<WidgetRect> } = {}): DesktopWidget {
  const settings = defaultWidgetSettings();
  if (options.pinned) {
    settings.background = "transparent";
  }

  return {
    id: crypto.randomUUID(),
    type,
    name: widgetNames[type],
    pinned: Boolean(options.pinned),
    locked: Boolean(options.pinned),
    zIndex: index + 1,
    rect: {
      x: options.rect?.x !== undefined ? options.rect.x : 32 + (index % 4) * 32,
      y: options.rect?.y !== undefined ? options.rect.y : 96 + (index % 4) * 28,
      width: options.rect?.width !== undefined ? options.rect.width : defaultSettings.defaultSize.width,
      height: options.rect?.height !== undefined ? options.rect.height : defaultSettings.defaultSize.height
    },
    settings,
    data: defaultData(type)
  };
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  widgets: [],
  past: [],
  future: [],
  hydrated: false,
  setWidgets: (widgets) => set((state)=>history(state,widgets)),
  hydrate: (state) => set({ widgets: state.widgets, hydrated: true }),
  addWidget: (type, options) => {
    const widget = createWidget(type, get().widgets.length, options);
    const appSettings = useSettingsStore.getState().settings;
    widget.settings.background = options?.pinned ? "transparent" : appSettings.widgetBackground;
    widget.settings.radius = appSettings.cornerRadius;
    set((state) => history(state,[...state.widgets, widget]));
    return widget;
  },
  removeWidget: (id) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === id);
      const toRemove = target?.groupId 
        ? state.widgets.filter((w) => w.groupId === target.groupId).map(w => w.id)
        : [id];
      return history(state, state.widgets.filter((w) => !toRemove.includes(w.id)));
    }),
  duplicateWidget: (id) =>
    set((state) => {
      const source = state.widgets.find((widget) => widget.id === id);
      if (!source) return state;
      const copy: DesktopWidget = {
        ...source,
        id: crypto.randomUUID(),
        name: `${source.name} Copy`,
        rect: { ...source.rect, x: source.rect.x + 24, y: source.rect.y + 24 }
      };
      return history(state,[...state.widgets, copy]);
    }),
  updateWidget: (id, patch) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === id);
      const groupIds = target?.groupId 
        ? state.widgets.filter((w) => w.groupId === target.groupId).map(w => w.id)
        : [id];
      
      const nextWidgets = state.widgets.map((widget) => {
        if (groupIds.includes(widget.id)) {
          // If updating pinned or locked state, sync across the group
          const syncedPatch: Partial<DesktopWidget> = {};
          if (patch.pinned !== undefined) syncedPatch.pinned = patch.pinned;
          if (patch.locked !== undefined) syncedPatch.locked = patch.locked;
          if (patch.hidden !== undefined) syncedPatch.hidden = patch.hidden;
          
          // Only the directly edited widget gets other patches (like name, data, settings)
          if (widget.id === id) {
            return { ...widget, ...patch };
          }
          return { ...widget, ...syncedPatch };
        }
        return widget;
      });
      return history(state, nextWidgets);
    }),
  updateRect: (id, rect) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === id);
      if (!target) return state;

      const groupWidgets = target.groupId 
        ? state.widgets.filter((w) => w.groupId === target.groupId && !w.locked)
        : [target];

      const dx = rect.x !== undefined ? rect.x - target.rect.x : 0;
      const dy = rect.y !== undefined ? rect.y - target.rect.y : 0;
      const dw = rect.width !== undefined ? rect.width - target.rect.width : 0;
      const dh = rect.height !== undefined ? rect.height - target.rect.height : 0;

      const nextWidgets = state.widgets.map((widget) => {
        const inGroup = groupWidgets.some(gw => gw.id === widget.id);
        if (inGroup) {
          if (widget.id === id) {
            // Primary element gets the direct values
            return {
              ...widget,
              rect: {
                ...widget.rect,
                x: rect.x !== undefined ? rect.x : widget.rect.x,
                y: rect.y !== undefined ? rect.y : widget.rect.y,
                width: rect.width !== undefined ? rect.width : widget.rect.width,
                height: rect.height !== undefined ? rect.height : widget.rect.height
              }
            };
          } else {
            // Non-primary group elements get delta offsets. We also keep size standard but move them
            return {
              ...widget,
              rect: {
                ...widget.rect,
                x: widget.rect.x + dx,
                y: widget.rect.y + dy,
                // Resize together optionally or just keep position
                width: widget.rect.width + dw,
                height: widget.rect.height + dh
              }
            };
          }
        }
        return widget;
      });
      return history(state, nextWidgets);
    }),
  updateSettings: (id, settings) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === id);
      const groupIds = target?.groupId 
        ? state.widgets.filter((w) => w.groupId === target.groupId).map(w => w.id)
        : [id];

      return history(state,
        state.widgets.map((widget) =>
          groupIds.includes(widget.id) ? { ...widget, settings: { ...widget.settings, ...settings } } : widget
        ));
    }),
  undo:()=>set(state=>{const previous=state.past[state.past.length-1];if(!previous)return state;return{widgets:structuredClone(previous),past:state.past.slice(0,-1),future:[structuredClone(state.widgets),...state.future].slice(0,50)}}),
  redo:()=>set(state=>{const next=state.future[0];if(!next)return state;return{widgets:structuredClone(next),past:[...state.past,structuredClone(state.widgets)].slice(-50),future:state.future.slice(1)}}),
  syncWidgets: (widgets) => set({ widgets })
}));

function defaultData(type: WidgetKind): Record<string, unknown> {
  if (type === "todo") return { items: [{ id: crypto.randomUUID(), text: "Plan the day", done: false }] };
  if (type === "notes") return { text: "Write a note..." };
  if (type === "links") return { links: [{ label: "OpenAI", url: "https://openai.com" }] };
  if (type === "weather") return { location: "Local", apiKey: "" };
  if (type === "mindmap") {
    return {
      root: {
        id: "root",
        text: "Central Idea",
        children: [
          {
            id: "branch-1",
            text: "Topic A",
            children: []
          },
          {
            id: "branch-2",
            text: "Topic B",
            children: []
          }
        ]
      }
    };
  }
  if (type === "pomodoro") {
    return {
      duration: 1500, // 25 min default focus
      isRunning: false,
      mode: "focus", // focus | shortBreak | longBreak
      timeLeft: 1500
    };
  }
  if (type === "worldclock") {
    return {
      clocks: [
        { id: "clock-1", label: "London", timezone: "Europe/London" },
        { id: "clock-2", label: "Tokyo", timezone: "Asia/Tokyo" }
      ]
    };
  }
  if (type === "stickynotes") {
    return {
      notes: [
        { id: "note-1", title: "Idea", content: "Implement drag and drop support.", color: "bg-amber-100 dark:bg-amber-950/40 border-amber-300" },
        { id: "note-2", title: "Task", content: "Review widget designs.", color: "bg-blue-100 dark:bg-blue-950/40 border-blue-300" }
      ]
    };
  }
  if (type === "calculator") {
    return {
      input: "0",
      history: ""
    };
  }
  if (type === "chatbot") {
    return {
      messages: [
        { id: "msg-1", role: "assistant", text: "Hello! I am your AI assistant. How can I help you today?" }
      ],
      persona: "assistant"
    };
  }
  return {};
}
