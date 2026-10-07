import { useState } from "react";
import { USERS } from "./data/users";
import type { User } from "./data/users";
import { loadSession, saveSession } from "./storage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(
    () => USERS.find((u) => u.username === loadSession()) ?? null,
  );

  function login(u: User) {
    saveSession(u.username);
    setUser(u);
  }

  function logout() {
    saveSession(null);
    setUser(null);
  }

  return user ? (
    <Dashboard key={user.username} user={user} onLogout={logout} />
  ) : (
    <Login onLogin={login} />
  );
}
