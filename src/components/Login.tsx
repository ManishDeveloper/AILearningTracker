import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError(
        "Supabase is not configured. Add the project URL and publishable key to .env.local, then restart the app.",
      );
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signupError) throw signupError;
        if (!data.session) {
          setMessage(
            "Account created. Check your email to confirm your address, then log in.",
          );
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to authenticate.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>🤖 AI Learning Tracker</h1>
        <p className="muted">
          {mode === "login"
            ? "Sign in to track your AI learning journey"
            : "Create an account to get started"}
        </p>
        {mode === "signup" && (
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={6}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p className="muted">{message}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Create an account"
            : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
