import { useState } from "react";
import type { FormEvent } from "react";
import { authenticate } from "../data/users";
import type { User } from "../data/users";

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const user = authenticate(username, password);
    if (user) onLogin(user);
    else setError("Invalid username or password");
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>🤖 AI Learning Tracker</h1>
        <p className="muted">Sign in to track your AI learning journey</p>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
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
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">
          Log in
        </button>
      </form>
    </div>
  );
}
