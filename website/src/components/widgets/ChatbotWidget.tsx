import { useState, useRef, useEffect } from "react";
import type { DesktopWidget } from "../../types/widget";
import { useWidgetStore } from "../../store/widgetStore";
import { useAuthStore, BACKEND_URL } from "../../store/authStore";
import { executeWidgetCommand } from "../../lib/widgetAgent";
import { Send, Trash2, Bot, Sparkles, Smile, Code } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

type ReasoningEffort = "low" | "medium" | "high" | "max";

const REASONING_OPTIONS: Array<{ value: ReasoningEffort; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

const PERSONAS = [
  { id: "assistant", label: "Assistant", icon: <Bot size={13} />, description: "Helpful companion" },
  { id: "motivator", label: "Motivator", icon: <Sparkles size={13} />, description: "Your biggest fan" },
  { id: "joker", label: "Joker", icon: <Smile size={13} />, description: "Developer comedy" },
  { id: "coder", label: "Coder", icon: <Code size={13} />, description: "Programming partner" },
];

const BOT_RESPONSES: Record<string, string[]> = {
  assistant: [
    "I'm here to help you coordinate your desk widgets! What's on your mind?",
    "Need help managing your todo checklist, focus timer, or custom widgets?",
    "Widget Studio is designed to keep your focus sharp and your desktop looking stunning.",
    "Did you know you can snap widgets to a 12px grid inside the Settings panel?",
    "To make a widget float permanently on your desktop, toggle the 'Pin' icon in its header!"
  ],
  motivator: [
    "You are doing absolute wonders today! Let's conquer these tasks together!",
    "No mountain is too high! Keep going, the breakthrough is right around the corner!",
    "Remember: every small step forward is bringing you closer to your grand goals!",
    "Let's check off one more task on that Todo list! You've got this!",
    "Time is your asset. Set the Pomodoro timer and show them what you are made of!"
  ],
  joker: [
    "Why do programmers wear glasses? Because they can't C#!",
    "There are 10 types of people in the world: those who understand binary, and those who don't.",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
    "What is a programmer's favorite hangout place? Foo Bar!",
    "An SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'"
  ],
  coder: [
    "Code is like humor. When you have to explain it, it’s bad.",
    "Keep functions clean, variables readable, and commits descriptive.",
    "Stuck on a bug? Try rubber duck debugging. Explain the logic out loud to me!",
    "Remember: premature optimization is the root of all evil. Get it working first!",
    "A clean codebase is a happy codebase. Don't forget to refactor as you go."
  ]
};

export function ChatbotWidget({ widget }: { widget: DesktopWidget }) {
  const updateWidget = useWidgetStore((state) => state.updateWidget);
  const widgets = useWidgetStore((state) => state.widgets);
  const setWidgets = useWidgetStore((state) => state.setWidgets);
  const messages = (widget.data?.messages as Message[]) ?? [];
  const currentPersona = String(widget.data?.persona ?? "assistant");
  const reasoningEffort = (REASONING_OPTIONS.some((option) => option.value === widget.data?.reasoningEffort)
    ? widget.data?.reasoningEffort
    : "high") as ReasoningEffort;
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: inputText.trim()
    };

    const nextMessages = [...messages, userMessage];
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        messages: nextMessages
      }
    });

    setInputText("");
    setIsTyping(true);

    const commandResult = executeWidgetCommand(userMessage.text, widgets);
    if (commandResult.widgets !== widgets) {
      setWidgets(commandResult.widgets);
      updateWidget(widget.id, { data: { ...widget.data, messages: [...nextMessages, { id: crypto.randomUUID(), role: "assistant", text: commandResult.message }] } });
      setIsTyping(false);
      return;
    }

    const token = useAuthStore.getState().token;
    if (token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chatbot/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: nextMessages.map(m => ({ role: m.role, text: m.text })),
            persona: currentPersona,
            reasoning_effort: reasoningEffort
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply
          };
          updateWidget(widget.id, {
            data: {
              ...widget.data,
              messages: [...nextMessages, aiMessage]
            }
          });
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn("Backend chat failed, falling back to local simulation", err);
      }
    }

    // Local simulation fallback
    setTimeout(() => {
      let responseText = "";
      const lower = userMessage.text.toLowerCase();

      if (lower.includes("time") || lower.includes("clock")) {
        responseText = `The current local time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}. Check out the Clock widget for a live update!`;
      } else if (lower.includes("weather")) {
        responseText = "The weather is currently offline-safe and ambient, but it is always sunny inside Widget Studio!";
      } else if (lower.includes("date") || lower.includes("calendar")) {
        responseText = `Today is ${new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Check the Calendar widget to plan ahead!`;
      } else {
        const pool = BOT_RESPONSES[currentPersona] || BOT_RESPONSES.assistant;
        responseText = pool[Math.floor(Math.random() * pool.length)];
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: responseText
      };

      updateWidget(widget.id, {
        data: {
          ...widget.data,
          messages: [...nextMessages, aiMessage]
        }
      });
      setIsTyping(false);
    }, 1000);
  };

  const handleClear = () => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        messages: [
          { id: crypto.randomUUID(), role: "assistant", text: `Chat cleared. Hi! I'm your ${currentPersona} assistant. How can I help you now?` }
        ]
      }
    });
  };

  const handlePersonaChange = (personaId: string) => {
    updateWidget(widget.id, {
      data: {
        ...widget.data,
        persona: personaId,
        messages: [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: `Persona changed to ${PERSONAS.find(p => p.id === personaId)?.label}. ${BOT_RESPONSES[personaId][0]}`
          }
        ]
      }
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden text-xs">
      {/* Persona Selectors */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 pb-2 dark:border-white/10">
        <div className="flex gap-1">
          {PERSONAS.map((p) => {
            const active = p.id === currentPersona;
            return (
              <button
                key={p.id}
                onClick={() => handlePersonaChange(p.id)}
                title={p.description}
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 transition ${
                  active ? "bg-accent text-white" : "bg-black/5 text-muted hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                }`}
              >
                {p.icon}
                <span className="hidden sm:inline font-medium">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`reasoning-effort-${widget.id}`}>Reasoning effort</label>
          <select
            id={`reasoning-effort-${widget.id}`}
            value={reasoningEffort}
            onChange={(event) => updateWidget(widget.id, {
              data: { ...widget.data, reasoningEffort: event.target.value as ReasoningEffort }
            })}
            title="Reasoning effort"
            className="max-w-[74px] rounded-md border border-black/10 bg-black/5 px-1.5 py-1 text-[10px] text-muted outline-none focus:ring-2 focus:ring-accent/50 dark:border-white/10 dark:bg-white/5"
          >
            {REASONING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button
            onClick={handleClear}
            title="Clear chat history"
            className="rounded-md p-1 text-muted hover:bg-black/10 hover:text-red-500 dark:hover:bg-white/10"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Messages Window */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${
                  isUser
                    ? "rounded-tr-none bg-accent text-white"
                    : "rounded-tl-none bg-black/5 border border-black/5 dark:bg-white/5 dark:border-white/5 text-text"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-none bg-black/5 border border-black/5 dark:bg-white/5 dark:border-white/5 px-3 py-2 text-muted italic flex items-center gap-1">
              <span>{PERSONAS.find(p => p.id === currentPersona)?.label} is thinking</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} className="mt-2 flex shrink-0 gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type a message to the AI...`}
          disabled={isTyping}
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/10 px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-accent/50 dark:border-white/10 dark:bg-black/10"
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
