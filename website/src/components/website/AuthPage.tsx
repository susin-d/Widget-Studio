import { useState } from "react";
import { ArrowRight, Check, Chrome, Cloud, LockKeyhole, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { BACKEND_URL, useAuthStore } from "../../store/authStore";
import { useRouteStore } from "../../store/routeStore";

export function AuthPage() {
  const { authViewMode, setAuthViewMode, setRoute } = useRouteStore();
  const { loading, login, signup } = useAuthStore();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!emailInput || !passwordInput) { setErrorMessage("Enter an email and password to continue."); return; }
    try {
      if (authViewMode === "signup") await signup(emailInput, passwordInput);
      else await login(emailInput, passwordInput);
      setSuccessMessage(authViewMode === "signup" ? "Your account is ready. Loading your canvas…" : "Welcome back. Loading your canvas…");
      window.setTimeout(() => setRoute("dashboard"), 900);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not complete that request. Try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="site-noise" aria-hidden="true" />
      <div className="auth-layout site-container">
        <section className="auth-story"><div className="eyebrow"><Cloud size={14} /> Your workspace, in step with you</div><h1>Keep your place<br /><em>wherever the day goes.</em></h1><p>Sign in to carry your Widget Studio layout between the browser canvas and your Windows desktop.</p><div className="auth-perks"><span><Check size={15} /><b>One synced canvas</b><small>Your positions, styles, and widget data stay together.</small></span><span><Check size={15} /><b>Local-first by design</b><small>Keep working when the connection is not cooperating.</small></span><span><Check size={15} /><b>Built for your attention</b><small>No feeds, no noise—just the tools you actually use.</small></span></div><div className="auth-story-preview"><div className="auth-preview-line"><span /><span /><span /><b>sync state</b></div><div className="auth-preview-row"><strong>morning workspace</strong><span><i /> up to date</span></div><div className="auth-preview-row muted"><span>4 widgets</span><span>last saved just now</span></div></div></section>
        <section className="auth-card"><div className="auth-card-head"><div className="auth-card-icon"><LockKeyhole size={20} /></div><span className="auth-card-secure"><ShieldCheck size={13} /> secure sync</span></div><div className="auth-card-title"><span className="card-overline">{authViewMode === "signup" ? "Create your space" : "Welcome back"}</span><h2>{authViewMode === "signup" ? "Start with a clean canvas." : "Your canvas is waiting."}</h2><p>{authViewMode === "signup" ? "Make an account to sync your workspace across devices." : "Sign in to pick up right where you left off."}</p></div><form onSubmit={handleAuthSubmit} className="auth-form"><label>Email address<input type="email" required value={emailInput} onChange={(event) => setEmailInput(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label>Password<input type="password" required value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} placeholder="At least 8 characters" autoComplete={authViewMode === "signup" ? "new-password" : "current-password"} /></label>{errorMessage && <div className="auth-message is-error">{errorMessage}</div>}{successMessage && <div className="auth-message is-success">{successMessage}</div>}<button type="submit" className="site-button site-button-primary auth-submit" disabled={loading}>{loading ? <><Loader2 size={15} className="spin-slow" /> Connecting…</> : <>{authViewMode === "signup" ? "Create account" : "Sign in"}<ArrowRight size={15} /></>}</button></form><div className="auth-divider"><span /> or <span /></div><button type="button" className="site-button site-button-secondary auth-google" onClick={() => window.location.assign(BACKEND_URL + "/api/auth/google?client=web")}><Chrome size={15} /> Continue with Google</button><button type="button" className="auth-switch" onClick={() => { setAuthViewMode(authViewMode === "signup" ? "login" : "signup"); setErrorMessage(""); setSuccessMessage(""); }}>{authViewMode === "signup" ? "Already have an account? Sign in" : "Need a sync account? Create one"}</button><p className="auth-legal"><Sparkles size={12} /> Your local layout is never replaced without your say-so.</p></section>
      </div>
    </div>
  );
}
