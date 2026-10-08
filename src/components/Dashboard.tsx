import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Container,
  Group,
  Menu,
  Notification,
  Paper,
  Portal,
  Tabs,
  Text,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import {
  IconBook2,
  IconCalendarEvent,
  IconFolders,
  IconLogout,
  IconRobot,
  IconAlertCircle,
  IconChevronDown,
  IconCircleCheck,
} from "@tabler/icons-react";
import type { User } from "../data/users";
import {
  emptyProgress,
  getErrorMessage,
  loadProgress,
  saveProgress,
} from "../storage";
import { notifyLeaderboardUpdated } from "../leaderboardEvents";
import type { UserProgress } from "../storage";
import Roadmap from "./Roadmap";
import Projects from "./Projects";
import GroupProgress from "./GroupProgress";

const TABS = [
  { value: "Roadmap", label: "Roadmap", Icon: IconBook2 },
  { value: "Projects", label: "Projects", Icon: IconFolders },
] as const;
type Tab = (typeof TABS)[number]["value"];
const TARGET_DATE = new Date(2027, 0, 1);

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdown(): Countdown {
  const remaining = Math.max(0, TARGET_DATE.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Dashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [loadResult, setLoadResult] = useState<{
    userId: string;
    attempt: number;
    error: string | null;
  }>({ userId: "", attempt: -1, error: null });
  const [saveError, setSaveError] = useState("");
  const [pointsToast, setPointsToast] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [countdown, setCountdown] = useState<Countdown>(getCountdown);
  const saveQueue = useRef(Promise.resolve());
  const [tab, setTab] = useState<Tab>("Roadmap");
  const loading =
    loadResult.userId !== user.id || loadResult.attempt !== loadAttempt;
  const loadError = loading ? "" : (loadResult.error ?? "");

  useEffect(() => {
    let active = true;
    loadProgress(user)
      .then((next) => {
        if (active) {
          setProgress(next);
          setLoadResult({ userId: user.id, attempt: loadAttempt, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadResult({
            userId: user.id,
            attempt: loadAttempt,
            error: getErrorMessage(error, "Unable to load progress."),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [user, loadAttempt]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pointsToast) return;
    const timer = window.setTimeout(() => setPointsToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [pointsToast]);

  function update(next: UserProgress, pointsDelta: number) {
    setProgress(next);
    setSaveError("");
    setPointsToast("");
    saveQueue.current = saveQueue.current
      .then(async () => {
        const warning = await saveProgress(user, next);
        notifyLeaderboardUpdated();
        if (warning) setSaveError(warning);
        setPointsToast(
          pointsDelta > 0 ? "+10 points earned!" : "10 points removed.",
        );
      })
      .catch((error: unknown) => {
        setSaveError(getErrorMessage(error, "Unable to save progress."));
      });
  }

  function toggleTopic(topicId: string) {
    const done = progress.completedTopics.includes(topicId);
    update(
      {
        ...progress,
        completedTopics: done
          ? progress.completedTopics.filter((id) => id !== topicId)
          : [...progress.completedTopics, topicId],
      },
      done ? -10 : 10,
    );
  }

  return (
    <div className="app-shell">
      {pointsToast && (
        <Portal>
          <Notification
            className="points-toast"
            color={pointsToast.startsWith("+") ? "teal" : "orange"}
            icon={<IconCircleCheck size={18} />}
            title="Points updated"
            onClose={() => setPointsToast("")}
          >
            {pointsToast}
          </Notification>
        </Portal>
      )}
      <header className="app-topbar">
        <Container fluid className="topbar-inner">
          <Group gap="sm">
            <ThemeIcon size={40} radius="xl" color="teal" variant="light">
              <IconRobot size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} className="brand-name">
                AI Learning Tracker
              </Text>
              <Text size="xs" className="brand-caption">
                YOUR LEARNING COHORT
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            <div
              className="nav-countdown"
              role="timer"
              aria-live="off"
              aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds until December 31, 2026`}
            >
              <IconCalendarEvent className="nav-countdown-icon" size={16} />
              <div className="nav-countdown-copy">
                <Text className="nav-countdown-target">
                  TARGET · 31 DEC 2026
                </Text>
                <div className="nav-countdown-values">
                  {[
                    [countdown.days, "d"],
                    [countdown.hours, "h"],
                    [countdown.minutes, "m"],
                    [countdown.seconds, "s"],
                  ].map(([value, unit]) => (
                    <span className="nav-countdown-unit" key={unit}>
                      <strong>{String(value).padStart(2, "0")}</strong>
                      <span className="nav-countdown-suffix">{unit}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <Button
                  className="profile-menu-trigger"
                  variant="subtle"
                  color="dark"
                  aria-label={`${user.displayName} profile menu`}
                  leftSection={
                    <Avatar color="teal" radius="xl" size={32}>
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </Avatar>
                  }
                  rightSection={<IconChevronDown size={15} />}
                >
                  {user.displayName}
                </Button>
              </Menu.Target>
              <Menu.Dropdown className="profile-menu-dropdown">
                <Menu.Item
                  className="profile-menu-item"
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={onLogout}
                >
                  Log out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </header>

      <main>
        <Container fluid className="app-container">
          {loading ? (
            <Paper className="state-panel" withBorder>
              <Text c="dimmed">Loading your progress...</Text>
            </Paper>
          ) : loadError ? (
            <Paper className="state-panel" withBorder>
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                Unable to load progress: {loadError}
              </Alert>
              <Button
                mt="md"
                variant="light"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              >
                Retry
              </Button>
            </Paper>
          ) : (
            <div className="dashboard-layout">
              <section className="dashboard-content">
                <Tabs
                  value={tab}
                  onChange={(value) => value && setTab(value as Tab)}
                  className="app-tabs"
                  keepMounted={false}
                >
                  <Tabs.List grow>
                    {TABS.map(({ value, label, Icon }) => (
                      <Tabs.Tab
                        key={value}
                        value={value}
                        leftSection={<Icon size={17} stroke={1.8} />}
                      >
                        {label}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                {tab === "Roadmap" && (
                  <Roadmap
                    user={user}
                    completedTopics={progress.completedTopics}
                    onToggle={toggleTopic}
                  />
                )}
                {tab === "Projects" && <Projects user={user} />}
              </section>

              <aside className="dashboard-sidebar">
                {saveError && (
                  <Alert
                    mb="md"
                    color="red"
                    icon={<IconAlertCircle size={18} />}
                  >
                    Progress save failed: {saveError}
                  </Alert>
                )}
                <Paper className="group-progress-panel" radius="md" withBorder>
                  <GroupProgress
                    currentUser={user.id}
                    displayName={user.displayName}
                    progress={progress}
                  />
                </Paper>
              </aside>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
