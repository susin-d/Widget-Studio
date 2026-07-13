export type WidgetKind =
  | "clock"
  | "weather"
  | "todo"
  | "notes"
  | "system"
  | "links"
  | "calendar"
  | "custom"
  | "mindmap"
  | "pomodoro"
  | "worldclock"
  | "stickynotes"
  | "calculator"
  | "chatbot";

export type ThemeMode = "light" | "dark" | "system";
export type ColorTheme = "berry-pop" | "citrus-splash" | "ocean-candy" | "lavender-dream" | "mint-sorbet" | "midnight-neon";
export type WidgetBackground = "solid" | "glass" | "transparent";

export interface WidgetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetSettings {
  opacity: number;
  background: WidgetBackground;
  radius: number;
  theme: ThemeMode;
  fontSize: number;
  refreshInterval: number;
  color?: string;
  textColor?: string;
  barColor?: string;
}

export interface DesktopWidget {
  id: string;
  type: WidgetKind;
  name: string;
  pinned: boolean;
  locked: boolean;
  zIndex?: number;
  groupId?: string;
  hidden?: boolean;
  rect: WidgetRect;
  settings: WidgetSettings;
  data?: Record<string, unknown>;
}

export interface AppSettings {
  theme: ThemeMode;
  colorTheme: ColorTheme;
  widgetBackground: WidgetBackground;
  accentColor: string;
  blurIntensity: number;
  shadowIntensity: number;
  cornerRadius: number;
  defaultSize: { width: number; height: number };
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
  restoreWidgetsOnLaunch: boolean;
  snapToGrid: boolean;
  lockPositions: boolean;
  skipTaskbar: boolean;
  desktopMode: boolean;
  batterySaverAutomation: boolean;
  focusHoursAutomation: boolean;
  onboardingComplete: boolean;
}

export interface PersistedState {
  version: number;
  widgets: DesktopWidget[];
  settings: AppSettings;
}
