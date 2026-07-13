export interface BrowserWidgetData extends Record<string, unknown> {
  version: 1;
  url: string;
}

export const DEFAULT_BROWSER_URL = "https://example.com";

export function normalizeBrowserUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function browserWidgetData(data: Record<string, unknown> | undefined): BrowserWidgetData {
  const url = normalizeBrowserUrl(String(data?.url ?? "")) ?? DEFAULT_BROWSER_URL;
  return { version: 1, url };
}
