import OpenAI from "openai";
import { nativeApi } from "./tauri";
import { normalizeBaseUrl, useAiProviderStore, type AiProviderSettings } from "../store/aiProviderStore";

export type DesktopReasoningEffort = "low" | "medium" | "high" | "max";

export interface DesktopChatMessage {
  role: "user" | "assistant";
  text: string;
}

export class DesktopAiError extends Error {
  constructor(message: string, public readonly kind: "missing-key" | "invalid-config" | "rate-limit" | "network" | "provider") {
    super(message);
    this.name = "DesktopAiError";
  }
}

function validateSettings(settings: AiProviderSettings): { baseUrl: string; model: string } {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new DesktopAiError("The OpenAI base URL must start with http:// or https://.", "invalid-config");
  }
  if (!settings.model.trim()) {
    throw new DesktopAiError("Enter an OpenAI model in Settings > AI Provider.", "invalid-config");
  }
  if (!Number.isFinite(settings.maxTokens) || settings.maxTokens < 1 || settings.maxTokens > 32768) {
    throw new DesktopAiError("Max output tokens must be between 1 and 32768.", "invalid-config");
  }
  if (!Number.isFinite(settings.temperature) || settings.temperature < 0 || settings.temperature > 2) {
    throw new DesktopAiError("Temperature must be between 0 and 2.", "invalid-config");
  }
  if (!Number.isFinite(settings.timeoutSeconds) || settings.timeoutSeconds < 1 || settings.timeoutSeconds > 300) {
    throw new DesktopAiError("Timeout must be between 1 and 300 seconds.", "invalid-config");
  }
  return { baseUrl, model: settings.model.trim() };
}

function describeProviderError(error: unknown): DesktopAiError {
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  const message = error instanceof Error ? error.message : String(error);
  if (status === 401) return new DesktopAiError("OpenAI rejected the API key. Update it in Settings > AI Provider.", "provider");
  if (status === 429) return new DesktopAiError("The AI provider rate limit was reached. Wait a moment and try again.", "rate-limit");
  if (status === 400) return new DesktopAiError(`The AI provider rejected the request: ${message}`, "invalid-config");
  if (status === 408 || /timeout|timed out|network|fetch failed|failed to fetch/i.test(message)) {
    return new DesktopAiError("The AI provider could not be reached before the timeout. Check the URL and connection.", "network");
  }
  return new DesktopAiError(`The AI provider returned an error: ${message}`, "provider");
}

export async function completeDesktopChat(
  messages: DesktopChatMessage[],
  persona: string,
  reasoningEffort: DesktopReasoningEffort,
): Promise<string> {
  const apiKey = (await nativeApi.getOpenaiApiKey())?.trim();
  if (!apiKey) {
    throw new DesktopAiError("Add an OpenAI API key in Settings > AI Provider before using chat.", "missing-key");
  }

  const settings = useAiProviderStore.getState();
  const { baseUrl, model } = validateSettings(settings);
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
    timeout: settings.timeoutSeconds * 1000,
    dangerouslyAllowBrowser: true,
  });

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: persona === "motivator"
            ? "You are a high-energy motivational assistant. Help the user get things done with practical, encouraging advice."
            : persona === "joker"
              ? "You are a developer joker. Respond with concise coding jokes or developer humor."
              : persona === "coder"
                ? "You are a coding partner. Help the user write clean, optimized code and resolve bugs."
                : "You are a helpful companion for Widget Studio. Help the user manage clocks, weather, notes, and desktop widgets.",
        },
        ...messages.slice(-20).map((message) => ({
          role: message.role,
          content: message.text,
        })),
      ],
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
      // OpenAI-compatible providers may support the same extended control used
      // by the previous backend provider. Keep the value configurable per chat.
      reasoning_effort: reasoningEffort as "low" | "medium" | "high",
    });
    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) throw new DesktopAiError("The AI provider returned an empty response. Try again.", "provider");
    return reply;
  } catch (error) {
    if (error instanceof DesktopAiError) throw error;
    throw describeProviderError(error);
  }
}

