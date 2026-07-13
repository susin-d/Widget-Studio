import { create } from "zustand";

export interface AiProviderSettings {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutSeconds: number;
}

interface AiProviderStore extends AiProviderSettings {
  setSettings: (settings: Partial<AiProviderSettings>) => void;
  syncSettings: (settings: AiProviderSettings) => void;
}

export const DEFAULT_AI_PROVIDER_SETTINGS: AiProviderSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  maxTokens: 250,
  temperature: 0.7,
  timeoutSeconds: 30,
};

const STORAGE_KEY = "widget-studio-ai-provider-settings";

function readSettings(): AiProviderSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<AiProviderSettings> | null;
    return normalizeSettings({ ...DEFAULT_AI_PROVIDER_SETTINGS, ...(stored ?? {}) });
  } catch {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }
}

function normalizeSettings(settings: AiProviderSettings): AiProviderSettings {
  return {
    baseUrl: settings.baseUrl,
    model: settings.model,
    maxTokens: Math.min(32768, Math.max(1, Number.isFinite(settings.maxTokens) ? Math.round(settings.maxTokens) : DEFAULT_AI_PROVIDER_SETTINGS.maxTokens)),
    temperature: Math.min(2, Math.max(0, Number.isFinite(settings.temperature) ? settings.temperature : DEFAULT_AI_PROVIDER_SETTINGS.temperature)),
    timeoutSeconds: Math.min(300, Math.max(1, Number.isFinite(settings.timeoutSeconds) ? Math.round(settings.timeoutSeconds) : DEFAULT_AI_PROVIDER_SETTINGS.timeoutSeconds)),
  };
}

function persistSettings(settings: AiProviderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Local settings are best-effort; the current in-memory value remains usable.
  }
}

export const useAiProviderStore = create<AiProviderStore>((set) => ({
  ...readSettings(),
  setSettings: (settings) => set((state) => {
    const next = normalizeSettings({ ...state, ...settings });
    const persisted = {
      baseUrl: next.baseUrl,
      model: next.model,
      maxTokens: next.maxTokens,
      temperature: next.temperature,
      timeoutSeconds: next.timeoutSeconds,
    };
    persistSettings(persisted);
    return persisted;
  }),
  syncSettings: (settings) => {
    const normalized = normalizeSettings(settings);
    persistSettings(normalized);
    set(normalized);
  },
}));

export function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_AI_PROVIDER_SETTINGS.baseUrl;
  return trimmed.replace(/\/chat\/completions$/i, "");
}
