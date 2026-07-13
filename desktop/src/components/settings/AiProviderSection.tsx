import { useEffect, useState } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { nativeApi } from "../../lib/tauri";
import { normalizeBaseUrl, useAiProviderStore } from "../../store/aiProviderStore";

export function AiProviderSection() {
  const aiSettings = useAiProviderStore();
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void nativeApi.getOpenaiApiKey().then((key) => setHasApiKey(Boolean(key))).catch(() => setHasApiKey(false));
  }, []);

  const save = async () => {
    setMessage("");
    setError("");
    try {
      if (apiKey.trim()) {
        await nativeApi.setOpenaiApiKey(apiKey.trim());
        setApiKey("");
        setHasApiKey(true);
      }
      aiSettings.setSettings({ baseUrl: normalizeBaseUrl(aiSettings.baseUrl) });
      setMessage("AI provider settings saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save AI provider settings.");
    }
  };

  const clearKey = async () => {
    setMessage("");
    setError("");
    try {
      await nativeApi.deleteOpenaiApiKey();
      setHasApiKey(false);
      setMessage("OpenAI API key cleared.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not clear the OpenAI API key.");
    }
  };

  return (
    <section className="border-t border-black/10 pt-5 dark:border-white/10">
      <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound size={16} /> AI Provider</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">The API key is stored in Windows Credential Manager and is never included in layout sync.</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="developer-field"><span>OpenAI API key</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={hasApiKey ? "Saved securely" : "sk-..."} autoComplete="off" /></label>
        <label className="developer-field"><span>Base URL</span><input type="url" value={aiSettings.baseUrl} onChange={(event) => aiSettings.setSettings({ baseUrl: event.target.value })} /></label>
        <label className="developer-field"><span>Model</span><input type="text" value={aiSettings.model} onChange={(event) => aiSettings.setSettings({ model: event.target.value })} /></label>
        <label className="developer-field"><span>Max output tokens</span><input type="number" min="1" max="32768" value={aiSettings.maxTokens} onChange={(event) => aiSettings.setSettings({ maxTokens: Number(event.target.value) })} /></label>
        <label className="developer-field"><span>Temperature</span><input type="number" min="0" max="2" step="0.1" value={aiSettings.temperature} onChange={(event) => aiSettings.setSettings({ temperature: Number(event.target.value) })} /></label>
        <label className="developer-field"><span>Timeout seconds</span><input type="number" min="1" max="300" value={aiSettings.timeoutSeconds} onChange={(event) => aiSettings.setSettings({ timeoutSeconds: Number(event.target.value) })} /></label>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => void save()} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white"><Save size={13} /> Save</button>
        <button type="button" onClick={() => void clearKey()} disabled={!hasApiKey} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"><Trash2 size={13} /> Clear key</button>
        <span className={`text-xs font-semibold ${hasApiKey ? "text-emerald-500" : "text-muted"}`}>{hasApiKey ? "Configured" : "Not configured"}</span>
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-emerald-500">{message}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
    </section>
  );
}

