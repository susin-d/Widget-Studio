import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors"
      >
        <span className="font-semibold text-slate-200 text-sm">{question}</span>
        {isOpen ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronDown size={16} className="text-indigo-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 pt-1 text-slate-400 text-xs leading-relaxed border-t border-white/5 bg-black/20">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FaqPage() {
  const faqs = [
    {
      question: "How does cloud layout synchronization work?",
      answer: "When logged in, any adjustments you make to widget dimensions, positions (X/Y coordinates), colors, or individual data fields are cached locally and synchronized with our PostgreSQL database via the FastAPI API. If you log in on another PC, your entire desktop setup is fetched and applied instantly."
    },
    {
      question: "Can I customize the visual aesthetics of the widgets?",
      answer: "Yes! Use the Theme Studio view in the settings sidebar to tune global properties like acrylic glass blur radius intensity, shadow weight opacity, corner radius curves, and highlight accent colors. You can also override themes (Light/Dark/System) on individual widgets."
    },
    {
      question: "Are custom developer widgets secure?",
      answer: "Absolutely. Custom developer widgets run inside a fully isolated sandboxed iframe. They cannot access system commands directly. Capabilities like copying to the clipboard, triggering system tray notifications, or reaching external HTTPS APIs prompt you for approval on first use."
    },
    {
      question: "What are the advantages of downloading the desktop installer?",
      answer: "The Windows desktop application (.msi package) runs natively inside a lightweight Tauri/Rust wrapper. Unlike running in a browser tab, native widgets pin directly to your wallpaper overlay layer, start automatically with Windows boot, and run with a near-zero idle RAM footprint."
    },
    {
      question: "Can I run the application offline?",
      answer: "Yes. All coordinates and widget edits are cached in the browser's LocalStorage or Tauri local data store. When connection is restored, local changes are pushed to sync with the server automatically."
    }
  ];

  return (
    <div className="bg-[#090a0f] text-white min-h-screen py-16 px-6 relative flex flex-col items-center">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] rounded-full bg-[#ff4f87]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <HelpCircle size={20} />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-[#ff4f87] bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Need help configuring sync, developer modes, or installing the app? Find quick answers below.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}
