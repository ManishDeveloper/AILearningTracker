import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  SegmentedControl,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowRight,
  IconRobot,
} from "@tabler/icons-react";
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
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <ThemeIcon size={42} radius="xl" color="orange" variant="light">
            <IconRobot size={23} />
          </ThemeIcon>
          <Text fw={700}>AI Learning Tracker</Text>
        </div>
        <div className="login-message">
          <Text className="eyebrow">A SHARED LEARNING GOAL</Text>
          <Title order={1}>
            Learn it.
            <br />
            Build it.
            <br />
            <span>Show it.</span>
          </Title>
          <Text className="login-subtitle">
            A little progress, made visible. Together through 31 December 2026.
          </Text>
        </div>
        <div className="login-steps" aria-hidden="true">
          {[
            ["01", "Learn"],
            ["02", "Build"],
            ["03", "Demo"],
          ].map(([number, label]) => (
            <div className="login-step" key={number}>
              <Text className="step-number">{number}</Text>
              <Text fw={600}>{label}</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="login-form-wrap">
        <Paper className="login-form-panel" radius="md" withBorder>
          <Text className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</Text>
          <Title order={2} mt={6}>
            {mode === "login" ? "Welcome back" : "Join your group"}
          </Title>
          <Text c="dimmed" size="sm" mt={4} mb="lg">
            {mode === "login"
              ? "Pick up where you left off."
              : "Create your learner account."}
          </Text>

          <SegmentedControl
            fullWidth
            value={mode}
            onChange={(value) => {
              setMode(value as "login" | "signup");
              setError("");
              setMessage("");
            }}
            data={[
              { label: "Log in", value: "login" },
              { label: "Create account", value: "signup" },
            ]}
            mb="lg"
          />

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <TextInput
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                autoComplete="name"
                required
              />
            )}
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />
            {error && (
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                {error}
              </Alert>
            )}
            {message && <Alert color="teal">{message}</Alert>}
            <Button
              type="submit"
              fullWidth
              loading={busy}
              rightSection={!busy && <IconArrowRight size={17} />}
            >
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
        </Paper>
      </section>
    </main>
  );
}
