import { useState } from "react";
import { Bot, LoaderCircle, WandSparkles } from "lucide-react";
import type { CustomWidgetDraft, VisualWidgetDocument } from "../../types/customWidget";
import { createDefaultVisualDocument } from "../../types/customWidget";
import { validateCustomWidgetSource } from "../../lib/customWidget";
import { BACKEND_URL, useAuthStore } from "../../store/authStore";

interface WidgetAgentProps {
  draft: CustomWidgetDraft;
  onApply: (draft: CustomWidgetDraft) => void;
}

const SYSTEM_INSTRUCTIONS = `You are Widget Studio's Custom Widget Agent. Create a safe, polished custom widget from the user's brief.
Return ONLY valid JSON, with no markdown fences:
{
  "name": "short widget name",
  "html": "sandbox-safe HTML fragment",
  "css": "CSS for the fragment",
  "js": "optional browser JavaScript",
  "permissions": ["network", "clipboard", "notifications", "openExternal"]
}
Rules:
- Use only browser HTML/CSS/JavaScript inside the widget sandbox.
- Do not use script tags, iframes, Tauri APIs, parent-window access, eval, Function, or inline event-handler attributes.
- Keep HTML as a fragment, without html/head/body tags.
- Use addEventListener in JavaScript.
- Request only permissions the widget actually needs.
- Never include secrets or credentials.`;

export function CustomWidgetAgent({ draft, onApply }: WidgetAgentProps) {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const generate = async () => {
    const prompt = brief.trim();
    if (!prompt || busy) return;
    const token = useAuthStore.getState().token;
    if (!token) {
      setMessage("Sign in to use the Custom Widget Agent.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          persona: "coder",
          reasoning_effort: "high",
          messages: [
            { role: "user", text: SYSTEM_INSTRUCTIONS },
            { role: "user", text: `Create this widget: ${prompt}` }
          ]
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail ?? "The widget agent request failed.");
      const parsed = parseAgentJson(payload.reply);
      const source = {
        html: String(parsed.html ?? ""),
        css: String(parsed.css ?? ""),
        js: String(parsed.js ?? "")
      };
      const validation = validateCustomWidgetSource(source);
      if (validation.errors.length) throw new Error(`Generated widget needs review: ${validation.errors.join(" ")}`);

      const visual: VisualWidgetDocument = draft.visual?.root ? draft.visual : createDefaultVisualDocument();
      const permissions = Array.isArray(parsed.permissions)
        ? Object.fromEntries(parsed.permissions.filter((value): value is string => typeof value === "string").map((value) => [value, true]))
        : draft.permissions;
      onApply({
        ...draft,
        name: String(parsed.name ?? prompt).trim() || "AI Custom Widget",
        mode: "code",
        visual,
        source,
        permissions
      });
      setMessage("Generated safely. Review the code and preview before publishing.");
      setBrief("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The widget agent could not generate a draft.");
    } finally {
      setBusy(false);
    }
  };

  return <section className="content-panel mb-4 border-accent/30">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Bot size={18} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><b>Custom Widget Agent</b><span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Draft only</span></div>
        <p className="mt-1 text-xs leading-5 text-muted">Describe the widget you want. The agent generates sandboxed code for review, preview, and manual publishing.</p>
        <div className="mt-3 flex gap-2">
          <input className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10" value={brief} onChange={(event) => setBrief(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void generate(); }} placeholder="e.g. a focus timer with start, pause, and reset buttons" disabled={busy} />
          <button className="primary-action shrink-0" onClick={() => void generate()} disabled={busy || !brief.trim()}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <WandSparkles size={14} />} {busy ? "Generating…" : "Generate"}</button>
        </div>
        {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      </div>
    </div>
  </section>;
}

function parseAgentJson(reply: unknown): Record<string, unknown> {
  if (typeof reply !== "string") throw new Error("The widget agent returned an invalid response.");
  const cleaned = reply.replace(/^\s*\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`\s*$/, "").trim();
  try {
    const value = JSON.parse(cleaned);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("The widget agent returned malformed JSON. Try a more specific brief.");
    try {
      const value = JSON.parse(cleaned.slice(start, end + 1));
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
      return value as Record<string, unknown>;
    } catch {
      throw new Error("The widget agent returned malformed JSON. Try again.");
    }
  }
}
