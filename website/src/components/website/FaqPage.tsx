import { useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle, Mail, MessageCircle, Sparkles } from "lucide-react";

const faqs = [
  { question: "What is Widget Studio?", answer: "Widget Studio is a customizable desktop workspace for Windows. It gives small, useful tools—like a clock, focus timer, notes, tasks, and links—a home you can arrange around the way you work." },
  { question: "What is the difference between the web canvas and the desktop client?", answer: "The web canvas is the easiest place to build and edit your layout from any browser. The native Windows client adds pinned overlays, startup behavior, and the feeling of having your widgets live on the desktop itself." },
  { question: "How does sync work?", answer: "When you sign in, Widget Studio saves your layout and widget data to the connected cloud service. Local changes are kept on the device too, so you can keep working offline and sync again when your connection returns." },
  { question: "Do I need an account to use the app?", answer: "No. You can use the local canvas without an account. An account is only needed when you want to carry a layout between the browser, desktop client, or multiple devices." },
  { question: "Can I build my own widgets?", answer: "Yes. The developer workspace lets you create custom HTML, CSS, and JavaScript widgets in an isolated sandbox. It is designed for useful personal tools, not unrestricted access to your machine." },
  { question: "What happens if I uninstall the client?", answer: "Your cloud-synced layout remains available to your account. Local-only changes that have not been synced may not be recoverable, so it is worth signing in before moving between machines." },
];

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return <article className={"faq-item " + (isOpen ? "is-open" : "")}><button type="button" onClick={onToggle} aria-expanded={isOpen}><span>{question}</span><ChevronDown size={17} /></button>{isOpen && <div className="faq-answer"><p>{answer}</p></div>}</article>;
}

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="marketing-page page-with-top-space">
      <div className="site-noise" aria-hidden="true" />
      <div className="site-container page-intro faq-intro"><div className="eyebrow"><HelpCircle size={14} /> A little help, right this way</div><h1>Good questions make<br /><em>better tools.</em></h1><p>Everything you need to understand the canvas, sync, and the native desktop experience.</p></div>
      <section className="site-container faq-layout"><div className="faq-side"><div className="faq-side-icon"><MessageCircle size={20} /></div><h2>Still wondering<br />about something?</h2><p>Tell us what is unclear and we will make the answer easier to find.</p><a href="mailto:hello@widgetstudio.app" className="inline-link">Email the team <Mail size={15} /></a><div className="faq-side-note"><Sparkles size={14} /><span>We are building this with real people, not a wall of copy.</span></div></div><div className="faq-list">{faqs.map((faq, index) => <FaqItem key={faq.question} question={faq.question} answer={faq.answer} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? -1 : index)} />)}</div></section>
      <section className="site-container faq-cta"><div><div className="eyebrow">Ready when you are</div><h2>Make the first widget<br /><em>something you need.</em></h2></div><a href="#download" className="site-button site-button-primary">Download for Windows <ArrowRight size={15} /></a></section>
    </div>
  );
}
