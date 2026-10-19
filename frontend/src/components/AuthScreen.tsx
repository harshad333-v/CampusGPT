import { useState, type FormEvent } from "react";
import type { User } from "../types";

interface Props {
  onAuthenticated: (user: User) => void;
  onError: (message: string) => void;
}

export default function AuthScreen({ onAuthenticated, onError }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    onError("");
    setBusy(true);
    try {
      const { api } = await import("../api");
      const result = mode === "login"
        ? await api.login(email, password)
        : await api.register(fullName, email, password);
      onAuthenticated(result.user);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand brand-light">
          <span className="brand-mark">C</span>
          <span>CampusGPT</span>
        </div>
        <div className="auth-story-copy">
          <p className="eyebrow">YOUR CAMPUS, CONNECTED</p>
          <h1>Answers grounded in your college documents.</h1>
          <p>Ask about notices, course topics, class schedules and campus updates. Every answer can point back to its source.</p>
          <div className="story-points">
            <div><span>01</span><p>Search across university documents</p></div>
            <div><span>02</span><p>Get context-aware answers</p></div>
            <div><span>03</span><p>See the sources behind the response</p></div>
          </div>
        </div>
        <p className="story-footer">A more helpful way to navigate campus life.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
          <h2>{mode === "login" ? "Sign in to CampusGPT" : "Create your account"}</h2>
          <p className="muted">{mode === "login" ? "Continue where you left off." : "Your new account starts with student access."}</p>
          <form className="form-stack" onSubmit={submit}>
            {mode === "register" && (
              <label className="field">
                <span>Full name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" minLength={2} maxLength={100} required placeholder="Your full name" />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="you@university.edu" />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Enter your password"} />
            </label>
            <button className="button button-primary button-full" type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to CampusGPT?" : "Already have an account?"}{" "}
            <button type="button" className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
          <p className="tiny muted auth-privacy">Your session is protected by an HttpOnly cookie. Passwords are never stored in the browser.</p>
        </div>
      </section>
    </main>
  );
}
