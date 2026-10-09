import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Select,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBook2,
  IconCircleCheck,
  IconFolderPlus,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { ROADMAP } from "../data/roadmap";
import { getErrorMessage, loadLeaderboard } from "../storage";
import type { LeaderboardEntry } from "../storage";
import { loadActivity, toggleActivityReaction } from "../activity";
import type { ActivityEvent } from "../activity";
import LearnerProfileModal from "./LearnerProfileModal";

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
type ActivityFilter = "all" | "learning" | "projects" | "resources";

function formatTime(timestamp: string): string {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(timestamp)) / 1000),
  );
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, seconds] of units) {
    if (elapsedSeconds >= seconds) {
      return relativeTime.format(-Math.floor(elapsedSeconds / seconds), unit);
    }
  }
  return relativeTime.format(-elapsedSeconds, "second");
}

function eventPresentation(event: ActivityEvent): {
  verb: string;
  subject: string;
  icon: typeof IconBook2;
  color: string;
  detail?: string;
} {
  const topicTitle = ROADMAP.flatMap((module) => module.topics).find(
    (topic) => topic.id === event.topic_id,
  )?.title;

  switch (event.event_type) {
    case "topic_started":
      return {
        verb: "started learning",
        subject: topicTitle ?? "a topic",
        icon: IconPlayerPlay,
        color: "orange",
      };
    case "topic_completed":
      return {
        verb: "completed",
        subject: topicTitle ?? "a topic",
        icon: IconCircleCheck,
        color: "teal",
      };
    case "project_added":
      return {
        verb: "added a project",
        subject: event.subject,
        icon: IconFolderPlus,
        color: "blue",
      };
    case "resource_added":
      return {
        verb: "shared a resource",
        subject: event.subject,
        icon: IconBook2,
        color: "green",
        detail: topicTitle ? `For ${topicTitle}` : undefined,
      };
  }
}

function ActivityRow({
  event,
  onOpenProfile,
  onToggleReaction,
  reacting,
}: {
  event: ActivityEvent;
  onOpenProfile: (event: ActivityEvent) => void;
  onToggleReaction: (event: ActivityEvent) => void;
  reacting: boolean;
}) {
  const presentation = eventPresentation(event);
  const EventIcon = presentation.icon;

  return (
    <article className="activity-row">
      <ThemeIcon color={presentation.color} variant="light" size={38}>
        <EventIcon size={19} />
      </ThemeIcon>
      <div className="activity-row-copy">
        <Text size="sm">
          <button
            type="button"
            className="activity-actor-button"
            onClick={() => onOpenProfile(event)}
          >
            {event.display_name}
          </button>{" "}
          {presentation.verb}{" "}
          {event.target_url &&
          (event.event_type === "project_added" ||
            event.event_type === "resource_added") ? (
            <Anchor
              href={event.target_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {presentation.subject}
            </Anchor>
          ) : (
            <strong>{presentation.subject}</strong>
          )}
        </Text>
        {presentation.detail && (
          <Text size="xs" c="dimmed">
            {presentation.detail}
          </Text>
        )}
        <Button
          className="activity-clap-button"
          variant={event.reacted_by_me ? "light" : "subtle"}
          color={event.reacted_by_me ? "teal" : "gray"}
          size="xs"
          leftSection={
            <span className="activity-clap-icon" aria-hidden="true">
              👏
            </span>
          }
          loading={reacting}
          onClick={() => onToggleReaction(event)}
        >
          {event.reaction_count > 0 ? event.reaction_count : "Clap"}
        </Button>
      </div>
      <Text className="activity-row-time" size="xs" c="dimmed">
        {formatTime(event.created_at)}
      </Text>
    </article>
  );
}

export default function ActivityFeed({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [learners, setLearners] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interactionError, setInteractionError] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [userFilter, setUserFilter] = useState("all");
  const [reactingEventId, setReactingEventId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{
    learner: LeaderboardEntry;
    rank: number;
  } | null>(null);

  const usersById = new Map(
    learners.map((learner) => [learner.user_id, learner.display_name]),
  );
  for (const event of events) {
    usersById.set(event.user_id, event.display_name);
  }
  const userFilterOptions = [
    { value: "all", label: "All users" },
    ...Array.from(usersById)
      .sort(([, firstName], [, secondName]) =>
        firstName.localeCompare(secondName),
      )
      .map(([userId, displayName]) => ({ value: userId, label: displayName })),
  ];

  const filteredEvents = events.filter((event) => {
    const matchesUser = userFilter === "all" || event.user_id === userFilter;
    const matchesCategory =
      filter === "all" ||
      (filter === "learning" &&
        (event.event_type === "topic_started" ||
          event.event_type === "topic_completed")) ||
      (filter === "projects" && event.event_type === "project_added") ||
      (filter === "resources" && event.event_type === "resource_added");
    return matchesUser && matchesCategory;
  });

  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadActivity(currentUserId)
        .then((nextEvents) => {
          if (active) {
            setEvents(nextEvents);
            setError("");
          }
        })
        .catch((loadError: unknown) => {
          if (active) {
            setError(getErrorMessage(loadError, "Unable to load activity."));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      loadLeaderboard()
        .then((entries) => {
          if (active) setLearners(entries);
        })
        .catch(() => undefined);
    };

    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentUserId]);

  async function openLearnerProfile(event: ActivityEvent) {
    setInteractionError("");
    try {
      const entries = await loadLeaderboard();
      const ranked = [...entries].sort(
        (a, b) =>
          b.points_total - a.points_total ||
          b.progress_percent - a.progress_percent,
      );
      const rankIndex = ranked.findIndex(
        (entry) => entry.user_id === event.user_id,
      );
      const learner = ranked[rankIndex] ?? {
        user_id: event.user_id,
        display_name: event.display_name,
        progress_percent: 0,
        points_total: 0,
        completed_topics: 0,
        projects_count: 0,
        resources_count: 0,
      };
      setSelectedProfile({
        learner,
        rank: rankIndex >= 0 ? rankIndex + 1 : ranked.length + 1,
      });
    } catch (profileLoadError: unknown) {
      setInteractionError(
        getErrorMessage(profileLoadError, "Unable to load this profile."),
      );
    }
  }

  async function toggleReaction(event: ActivityEvent) {
    setInteractionError("");
    setReactingEventId(event.id);
    try {
      await toggleActivityReaction(
        event.id,
        currentUserId,
        event.reacted_by_me,
      );
      setEvents(await loadActivity(currentUserId));
    } catch (reactionError: unknown) {
      setInteractionError(
        getErrorMessage(reactionError, "Unable to update reaction."),
      );
    } finally {
      setReactingEventId(null);
    }
  }

  return (
    <Stack gap="md" className="activity-page">
      <Group justify="space-between" align="center">
        <div>
          <Text className="eyebrow">COHORT</Text>
          <Title order={2}>Activity</Title>
        </div>
        <Badge color="gray" variant="light">
          Latest 50
        </Badge>
      </Group>

      <div className="activity-filters">
        <SegmentedControl
          fullWidth
          value={filter}
          onChange={(value) => setFilter(value as ActivityFilter)}
          data={[
            { label: "All", value: "all" },
            { label: "Learning", value: "learning" },
            { label: "Projects", value: "projects" },
            { label: "Resources", value: "resources" },
          ]}
        />
        <Select
          aria-label="Filter activity by user"
          data={userFilterOptions}
          value={userFilter}
          onChange={(value) => value && setUserFilter(value)}
          allowDeselect={false}
        />
      </div>

      {error && <Alert color="red">{error}</Alert>}
      {interactionError && <Alert color="red">{interactionError}</Alert>}
      {loading ? (
        <Group justify="center" py="xl">
          <Loader color="teal" size="sm" />
          <Text size="sm" c="dimmed">
            Loading activity...
          </Text>
        </Group>
      ) : events.length === 0 && !error ? (
        <Text className="activity-empty" c="dimmed">
          No activity yet. Start a topic, share a resource, or add a project to
          get things moving.
        </Text>
      ) : filteredEvents.length === 0 ? (
        <Text className="activity-empty" c="dimmed">
          No activity in this category yet.
        </Text>
      ) : (
        <Stack gap={0} className="activity-list">
          {filteredEvents.map((event) => (
            <ActivityRow
              event={event}
              key={event.id}
              onOpenProfile={openLearnerProfile}
              onToggleReaction={toggleReaction}
              reacting={reactingEventId === event.id}
            />
          ))}
        </Stack>
      )}
      <LearnerProfileModal
        learner={selectedProfile?.learner ?? null}
        rank={selectedProfile?.rank ?? 0}
        onClose={() => setSelectedProfile(null)}
      />
    </Stack>
  );
}
