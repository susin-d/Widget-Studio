import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, Command, Download, Focus, LayoutGrid, LockKeyhole, MousePointer2, NotebookPen, Sparkles, Zap } from "lucide-react";
import { useRouteStore } from "../../store/routeStore";

function formatTime(seconds: number) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

function WindowBar({ label }: { label: string }) {
  return (
    <div className="preview-window-bar">
      <div className="preview-window-dots"><span /><span /><span /></div>
      <span>{label}</span>
      <span className="preview-window-live"><i /> syncing</span>
    </div>
  );
}

export function LandingPage() {
  const { setRoute } = useRouteStore();
  const [seconds, setSeconds] = useState(24 * 60 + 18);
  const [timerRunning, setTimerRunning] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const clockId = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const timerId = window.setInterval(() => setSeconds((value) => value > 0 ? value - 1 : 24 * 60 + 18), 1000);
    return () => window.clearInterval(timerId);
  }, [timerRunning]);

  return (
    <div className="marketing-page">
      <div className="site-noise" aria-hidden="true" />
      <div className="site-orb site-orb-one" aria-hidden="true" />
      <div className="site-orb site-orb-two" aria-hidden="true" />

      <section className="site-container hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> A calmer place for the work between the work</div>
          <h1>Put the useful things <em>where you can see them.</em></h1>
          <p className="hero-subtitle">Widget Studio turns your Windows desktop into a quiet command center for focus, context, and the small details that keep a day moving.</p>
          <div className="hero-actions">
            <button type="button" className="site-button site-button-primary site-button-large" onClick={() => setRoute("download")}><Download size={17} /> Download for Windows <ArrowRight size={16} /></button>
            <button type="button" className="site-button site-button-secondary site-button-large" onClick={() => setRoute("dashboard")}><LayoutGrid size={17} /> Try the web canvas</button>
          </div>
          <div className="hero-proof"><span><Check size={14} /> 13+ built-in widgets</span><span><Check size={14} /> syncs across devices</span><span><Check size={14} /> Windows native</span></div>
        </div>

        <div className="hero-visual" aria-label="Preview of a Widget Studio desktop workspace">
          <div className="hero-visual-glow" />
          <div className="workspace-preview">
            <WindowBar label="morning workspace" />
            <div className="workspace-preview-body">
              <div className="preview-sidebar">
                <div className="preview-sidebar-brand"><img src="/widget-studio-logo.png" alt="" /><span>Studio</span></div>
                <span className="preview-sidebar-section">Library</span>
                {[[Clock3, "Clock"], [Focus, "Focus"], [NotebookPen, "Notes"], [Zap, "Quick links"]].map(([Icon, label]) => {
                  const WidgetIcon = Icon as typeof Clock3;
                  return <div className="preview-sidebar-item" key={label as string}><WidgetIcon size={13} /><span>{label as string}</span></div>;
                })}
                <div className="preview-sidebar-footer"><LockKeyhole size={12} /> private layout</div>
              </div>
              <div className="preview-canvas">
                <div className="preview-canvas-top"><span>Canvas</span><span className="preview-toolbar"><Command size={11} /> K</span></div>
                <div className="preview-widget preview-widget-clock">
                  <div className="preview-widget-head"><span><Clock3 size={12} /> local time</span><i /></div>
                  <strong>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                  <small>{time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</small>
                </div>
                <div className="preview-widget preview-widget-focus">
                  <div className="preview-widget-head"><span><Focus size={12} /> focus session</span><b>in progress</b></div>
                  <strong>{formatTime(seconds)}</strong>
                  <div className="preview-progress"><span style={{ width: Math.max(8, (seconds / (25 * 60)) * 100) + "%" }} /></div>
                  <button type="button" onClick={() => setTimerRunning((running) => !running)}>{timerRunning ? "Pause" : "Start focus"}</button>
                </div>
                <div className="preview-widget preview-widget-note"><div className="preview-widget-head"><span><NotebookPen size={12} /> today</span><MousePointer2 size={12} /></div><p>Write the brief.<br />Ship the thing.<br />Leave room to think.</p></div>
                <div className="preview-widget preview-widget-tasks"><div className="preview-widget-head"><span>next up</span><span>3 items</span></div><p><i className="task-check is-done"><Check size={9} /></i> Review launch notes</p><p><i className="task-check" /> Tidy the canvas</p><p><i className="task-check" /> Take a real break</p></div>
                <div className="preview-selection"><span>selected</span><i /><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <span className="hero-visual-caption"><span className="caption-line" /> A little order, right on the desktop.</span>
        </div>
      </section>

      <section className="site-container signal-section">
        <div className="section-kicker">Built for the way a day actually moves</div>
        <div className="signal-grid">
          <article className="signal-card signal-card-featured"><div className="signal-icon"><Focus size={18} /></div><h2>Stay in the flow.</h2><p>Keep a timer, a note, and the next right thing close without adding another tab to your life.</p><span className="signal-number">01</span></article>
          <article className="signal-card"><div className="signal-icon warm"><LayoutGrid size={18} /></div><h2>Make it yours.</h2><p>Arrange, resize, recolor, and build a workspace that feels like it belongs to you.</p><span className="signal-number">02</span></article>
          <article className="signal-card"><div className="signal-icon cool"><LockKeyhole size={18} /></div><h2>Take it with you.</h2><p>Sign in once and your layout follows you from the browser canvas to the native client.</p><span className="signal-number">03</span></article>
        </div>
      </section>

      <section className="site-container story-section">
        <div className="story-art"><div className="story-art-grid" /><div className="story-stack"><span>focus</span><span>context</span><span>clarity</span></div><div className="story-art-note"><span>small things,<br /><strong>well placed.</strong></span><ArrowRight size={19} /></div></div>
        <div className="story-copy"><div className="eyebrow">A desktop with a point of view</div><h2>Less dashboard.<br /><em>More daily rhythm.</em></h2><p>Widget Studio is made for the spaces between big tasks: checking the time, collecting a thought, remembering what comes next. It gives those moments a home without asking you to leave the work.</p><div className="story-list"><span><Check size={15} /> Arrange your view around your attention</span><span><Check size={15} /> Use native overlays when you need them</span><span><Check size={15} /> Keep your data synced and close</span></div><button type="button" className="inline-link" onClick={() => setRoute("features")}>See how it works <ArrowRight size={15} /></button></div>
      </section>

      <section className="site-container cta-section"><div><div className="eyebrow"><Sparkles size={14} /> Your next screen can feel better</div><h2>Make room for the things<br /><em>that make work work.</em></h2></div><div className="cta-actions\"><button type="button" className="site-button site-button-primary site-button-large" onClick={() => setRoute("download")}>Get Widget Studio <ArrowRight size={16} /></button><button type="button" className="inline-link" onClick={() => setRoute("faq")}>Questions? Start here <ArrowRight size={15} /></button></div></section>
    </div>
  );
}
