import { useEffect, useState } from "react";
import { toAppUser } from "./data/users";
import type { User } from "./data/users";
import { supabase } from "./supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ? toAppUser(data.session.user) : null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) setUser(null);
  }

  if (loading) {
    return (
      <div className="login-wrap">
        <p className="muted">Loading your account...</p>
      </div>
    );
  }

  return user ? (
    <Dashboard key={user.id} user={user} onLogout={logout} />
  ) : (
    <Login />
  );
}
