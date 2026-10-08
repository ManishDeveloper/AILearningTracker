import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Indicator,
  Menu,
  Notification,
  Paper,
  Portal,
  Tabs,
  Text,
  ThemeIcon,
  Alert,
  Tooltip,
} from "@mantine/core";
import {
  IconBook2,
  IconActivity,
  IconCalendarEvent,
  IconFolders,
  IconLogout,
  IconRobot,
  IconAlertCircle,
  IconBell,
  IconChevronDown,
  IconCircleCheck,
  IconHelpCircle,
  IconUserEdit,
} from "@tabler/icons-react";
import { ROADMAP } from "../data/roadmap";
import type { User } from "../data/users";
import {
  emptyProgress,
  getErrorMessage,
  loadProgress,
  saveProgress,
} from "../storage";
import { notifyLeaderboardUpdated } from "../leaderboardEvents";
import type { UserProgress } from "../storage";
import { loadUnreadActivityCount, markActivityRead } from "../activity";
import Roadmap from "./Roadmap";
import Projects from "./Projects";
import GroupProgress from "./GroupProgress";
import ProfileSettingsModal from "./ProfileSettingsModal";
import HelpGuideModal from "./HelpGuideModal";
import ActivityFeed from "./ActivityFeed";

function pointsForTopic(topicId: string): number {
  return (
    ROADMAP.flatMap((module) => module.topics).find(
      (topic) => topic.id === topicId,
    )?.points ?? 0
  );
}

const TABS = [
  { value: "Roadmap", label: "Roadmap", Icon: IconBook2 },
  { value: "Projects", label: "Projects", Icon: IconFolders },
  { value: "Activity", label: "Activity", Icon: IconActivity },
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
  onUserUpdated,
}: {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
}) {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [loadResult, setLoadResult] = useState<{
    userId: string;
    attempt: number;
    error: string | null;
  }>({ userId: "", attempt: -1, error: null });
  const [saveError, setSaveError] = useState("");
  const [pointsToast, setPointsToast] = useState<{
    title: string;
    message: string;
    color: "teal" | "orange";
  } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [countdown, setCountdown] = useState<Countdown>(getCountdown);
  const saveQueue = useRef(Promise.resolve());
  const [tab, setTab] = useState<Tab>("Roadmap");
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [activityNotification, setActivityNotification] = useState("");
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const activityCountInitialized = useRef(false);
  const previousUnreadActivityCount = useRef(0);
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
    const timer = window.setTimeout(() => setPointsToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [pointsToast]);

  useEffect(() => {
    if (!activityNotification) return;
    const timer = window.setTimeout(() => setActivityNotification(""), 6000);
    return () => window.clearTimeout(timer);
  }, [activityNotification]);

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        if (tab === "Activity") {
          await markActivityRead(user.id);
          previousUnreadActivityCount.current = 0;
          activityCountInitialized.current = true;
          if (active) setUnreadActivityCount(0);
        } else {
          const count = await loadUnreadActivityCount(user.id);
          if (
            activityCountInitialized.current &&
            count > previousUnreadActivityCount.current
          ) {
            const newCount = count - previousUnreadActivityCount.current;
            setActivityNotification(
              newCount === 1
                ? "New activity from your cohort."
                : `${newCount} new activities from your cohort.`,
            );
          }
          previousUnreadActivityCount.current = count;
          activityCountInitialized.current = true;
          if (active) setUnreadActivityCount(count);
        }
      } catch {
        previousUnreadActivityCount.current = 0;
        activityCountInitialized.current = true;
        if (active) setUnreadActivityCount(0);
      }
    };

    void refreshUnreadCount();
    const timer = window.setInterval(() => void refreshUnreadCount(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tab, user.id]);

  function update(
    next: UserProgress,
    pointsDelta: number,
    notification?: {
      title: string;
      message: string;
      color: "teal" | "orange";
    },
  ): Promise<boolean> {
    setProgress(next);
    setSaveError("");
    setPointsToast(null);
    const saveResult = saveQueue.current
      .then(async () => {
        const warning = await saveProgress(user, next);
        notifyLeaderboardUpdated();
        if (warning) {
          setSaveError(warning);
          return false;
        }
        if (notification) {
          setPointsToast(notification);
        } else if (pointsDelta !== 0) {
          setPointsToast({
            title: "Points updated",
            message:
              pointsDelta > 0
                ? `+${pointsDelta} points earned!`
                : `${Math.abs(pointsDelta)} points removed.`,
            color: pointsDelta > 0 ? "teal" : "orange",
          });
        }
        return true;
      })
      .catch((error: unknown) => {
        setSaveError(getErrorMessage(error, "Unable to save progress."));
        return false;
      });
    saveQueue.current = saveResult.then(() => undefined);
    return saveResult;
  }

  function startTopic(topicId: string, durationHours: number) {
    if (
      Object.values(progress.topicDetails).some(
        (detail) => detail.status === "in_progress",
      )
    ) {
      return;
    }
    const previous = progress.topicDetails[topicId] ?? {
      status: progress.completedTopics.includes(topicId)
        ? "complete"
        : "not_started",
      durationHours: 24,
      startedAt: null,
    };
    const wasComplete =
      previous.status === "complete" ||
      progress.completedTopics.includes(topicId);
    update(
      {
        completedTopics: wasComplete
          ? progress.completedTopics.filter((id) => id !== topicId)
          : progress.completedTopics,
        topicDetails: {
          ...progress.topicDetails,
          [topicId]: {
            ...previous,
            status: "in_progress",
            durationHours,
            startedAt: new Date().toISOString(),
          },
        },
      },
      wasComplete ? -pointsForTopic(topicId) : 0,
    );
  }

  function completeTopic(topicId: string) {
    const previous = progress.topicDetails[topicId];
    if (!previous || previous.status !== "in_progress") return;
    const topic = ROADMAP.flatMap((module) => module.topics).find(
      (topic) => topic.id === topicId,
    );
    const points = topic?.points ?? 0;
    update(
      {
        completedTopics: [...new Set([...progress.completedTopics, topicId])],
        topicDetails: {
          ...progress.topicDetails,
          [topicId]: { ...previous, status: "complete", startedAt: null },
        },
      },
      points,
      {
        title: "Great job!",
        message: `You completed ${topic?.title ?? "this topic"} and earned ${points} points.`,
        color: "teal",
      },
    );
  }

  function resetRoadmap(): Promise<boolean> {
    const completedTopics = new Set(progress.completedTopics);
    const completedCount = completedTopics.size;
    const pointsRemoved = [...completedTopics].reduce(
      (total, topicId) => total + pointsForTopic(topicId),
      0,
    );
    return update(emptyProgress(), -pointsRemoved, {
      title: "Roadmap reset",
      message:
        pointsRemoved > 0
          ? `${completedCount} completed topics and ${pointsRemoved} topic points removed. Projects and resources were kept.`
          : "Topic statuses and timers reset. Projects and resources were kept.",
      color: "orange",
    });
  }

  return (
    <div className="app-shell">
      {pointsToast && (
        <Portal>
          <Notification
            className="points-toast"
            color={pointsToast.color}
            icon={<IconCircleCheck size={18} />}
            title={pointsToast.title}
            onClose={() => setPointsToast(null)}
          >
            {pointsToast.message}
          </Notification>
        </Portal>
      )}
      {activityNotification && (
        <Portal>
          <Notification
            className="activity-notification-toast"
            color="teal"
            icon={<IconBell size={18} />}
            title="New activity"
            onClose={() => setActivityNotification("")}
            onClick={() => setTab("Activity")}
          >
            {activityNotification}
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
          <Group gap="sm" wrap="nowrap">
            <Group className="nav-countdown-group" gap="xs" wrap="nowrap">
              <div className="nav-target-date">
                <IconCalendarEvent className="nav-target-date-icon" size={18} />
                <div className="nav-target-date-copy">
                  <Text className="nav-target-date-label">TARGET DATE</Text>
                  <Text
                    component="time"
                    dateTime="2026-12-31"
                    className="nav-target-date-value"
                  >
                    31 DEC <span className="nav-target-date-year">2026</span>
                  </Text>
                </div>
              </div>
              <div
                className="nav-countdown"
                role="timer"
                aria-live="off"
                aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds until December 31, 2026`}
              >
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
            </Group>
            <Tooltip label="Activity notifications">
              <ActionIcon
                className="activity-notification-button"
                variant="subtle"
                color="dark"
                size={40}
                aria-label={
                  unreadActivityCount > 0
                    ? `${unreadActivityCount} unread activity notifications`
                    : "Activity notifications"
                }
                onClick={() => setTab("Activity")}
              >
                <Indicator
                  disabled={unreadActivityCount === 0}
                  color="orange"
                  size={17}
                  label={unreadActivityCount > 99 ? "99+" : unreadActivityCount}
                >
                  <IconBell size={20} />
                </Indicator>
              </ActionIcon>
            </Tooltip>
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
                  leftSection={<IconHelpCircle size={16} />}
                  onClick={() => setHelpGuideOpen(true)}
                >
                  Help &amp; guide
                </Menu.Item>
                <Menu.Item
                  className="profile-menu-item"
                  leftSection={<IconUserEdit size={16} />}
                  onClick={() => setProfileSettingsOpen(true)}
                >
                  Profile settings
                </Menu.Item>
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
                        {value === "Activity" ? (
                          <Group gap={6} wrap="nowrap">
                            <span>{label}</span>
                            {unreadActivityCount > 0 && (
                              <Badge size="sm" color="orange" variant="filled">
                                {unreadActivityCount > 99
                                  ? "99+"
                                  : unreadActivityCount}
                              </Badge>
                            )}
                          </Group>
                        ) : (
                          label
                        )}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                {tab === "Roadmap" && (
                  <Roadmap
                    user={user}
                    completedTopics={progress.completedTopics}
                    topicDetails={progress.topicDetails}
                    onStart={startTopic}
                    onComplete={completeTopic}
                  />
                )}
                {tab === "Projects" && <Projects user={user} />}
                {tab === "Activity" && <ActivityFeed currentUserId={user.id} />}
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
      <HelpGuideModal
        opened={helpGuideOpen}
        onClose={() => setHelpGuideOpen(false)}
      />
      <ProfileSettingsModal
        opened={profileSettingsOpen}
        user={user}
        onClose={() => setProfileSettingsOpen(false)}
        onUserUpdated={onUserUpdated}
        onResetRoadmap={resetRoadmap}
      />
    </div>
  );
}
