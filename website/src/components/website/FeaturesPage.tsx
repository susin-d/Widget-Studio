import { ArrowRight, CalendarDays, Check, Cloud, Code2, Cpu, Focus, Layers3, LockKeyhole, MousePointer2, NotebookPen, Palette, ShieldCheck, Sparkles, TimerReset, Zap } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

const widgets = [
  { icon: Focus, name: "Focus timer", description: "A simple rhythm for deep work, right where you can see it.", tone: "violet" },
  { icon: NotebookPen, name: "Sticky notes", description: "Catch the thought before it disappears. Keep it close until it is done.", tone: "coral" },
  { icon: CalendarDays, name: "Calendar", description: "See the shape of your day without opening another app.", tone: "gold" },
  { icon: Zap, name: "Quick links", description: "Your everyday destinations, one click away from the desktop.", tone: "blue" },
  { icon: Cpu, name: "System monitor", description: "A quiet glance at what your machine is carrying right now.", tone: "mint" },
  { icon: TimerReset, name: "Pomodoro", description: "Flexible intervals for momentum, rest, and getting back in.", tone: "rose" },
  { icon: Layers3, name: "Mindmap", description: "Turn a loose idea into something you can move around.", tone: "indigo" },
  { icon: MousePointer2, name: "Custom widgets", description: "Build your own with HTML, CSS, and JavaScript in a safe sandbox.", tone: "orange" },
];

export function FeaturesPage() {
  const { setRoute } = useRouteStore();

  return (
    <div className="marketing-page page-with-top-space">
      <div className="site-noise" aria-hidden="true" />
      <div className="site-container page-intro"><div className="eyebrow"><Sparkles size={14} /> Everything has a place</div><h1>The tools you reach for,<br /><em>already within reach.</em></h1><p>Widget Studio is deliberately small in all the right ways: fast to open, easy to shape, and focused on the details that help a day feel less scattered.</p></div>

      <section className="site-container capability-grid">
        <article className="capability-card capability-card-wide"><div className="capability-card-icon"><Palette size={20} /></div><div><span className="card-overline">Shape the surface</span><h2>Build a workspace<br />that looks like yours.</h2><p>Choose a color story, tune the glass, and place each widget where your attention naturally lands.</p></div><div className="mini-palette"><span /><span /><span /><span /><span /></div></article>
        <article className="capability-card"><div className="capability-card-icon violet"><Cloud size={20} /></div><span className="card-overline">Keep the thread</span><h2>Sync without<br />thinking about it.</h2><p>Cloud layout sync keeps your positions, styles, and widget data ready wherever you sign in.</p><div className="capability-stat"><strong>1</strong><span>canvas<br />everywhere</span></div></article>
        <article className="capability-card"><div className="capability-card-icon gold"><Code2 size={20} /></div><span className="card-overline">Go a little further</span><h2>Make your own<br />small tools.</h2><p>Custom widgets run in an isolated sandbox, so the canvas can grow with your workflow.</p><div className="code-lines\"><span>&lt;Widget name=&quot;ritual&quot; /&gt;</span><span>&lt;keep it useful /&gt;</span></div></article>
        <article className="capability-card capability-card-wide capability-card-dark"><div className="capability-card-icon mint"><ShieldCheck size={20} /></div><div><span className="card-overline">Native when it matters</span><h2>From browser canvas<br />to wallpaper overlay.</h2><p>Use the web editor to shape your layout. Install the Windows client when you want widgets pinned to the desktop.</p></div><div className="native-badge"><LockKeyhole size={14} /> Windows native</div></article>
      </section>

      <section className="site-container widget-catalog-section"><div className="section-heading-row"><div><div className="eyebrow">The built-in set</div><h2>Start with something useful.</h2></div><p>Eight ways to make the desktop do a little more for you, without making it feel busier.</p></div><div className="widget-catalog">{widgets.map(({ icon: Icon, name, description, tone }, index) => <article className="catalog-card" key={name}><div className={"catalog-icon " + tone}><Icon size={18} /></div><div><span className="catalog-index">0{index + 1}</span><h3>{name}</h3><p>{description}</p></div></article>)}</div></section>

      <section className="site-container promise-section"><div className="promise-mark"><Check size={20} /></div><div><div className="eyebrow">The promise</div><h2>Your attention is the product.</h2><p>Every decision in Widget Studio is meant to make the next useful action easier to find—not to keep you inside an app.</p></div><button type="button" className="site-button site-button-primary" onClick={() => setRoute("download")}>Get started <ArrowRight size={15} /></button></section>
    </div>
  );
}
