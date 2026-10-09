import { useEffect, useState } from "react";
import { Alert, Badge, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconAlertCircle,
  IconBook2,
  IconFolder,
  IconRocket,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import { completedTopicCount, topicPercent } from "../progress";
import { LEADERBOARD_UPDATED_EVENT } from "../leaderboardEvents";
import { getErrorMessage, loadLeaderboard } from "../storage";
import type { LeaderboardEntry, UserProgress } from "../storage";
import ProgressBar from "./ProgressBar";
import LearnerProfileModal from "./LearnerProfileModal";
import RankConfetti from "./RankConfetti";
import PointsGuide from "./PointsGuide";

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || displayName;
}

function CountMetrics({
  topics,
  projects,
  resources,
}: {
  topics: number;
  projects: number;
  resources: number;
}) {
  const resourceCount = resources ?? 0;

  return (
    <div
      className="group-count-metrics"
      aria-label={`${topics} Topics, ${projects} Projects, ${resourceCount} Resources`}
    >
      <span className="group-count-primary">
        <span className="group-count-metric group-count-topics">
          <IconBook2 size={13} aria-hidden="true" />
          <strong>{topics}</strong>
          <span>Topics</span>
        </span>
        <span className="group-count-metric group-count-projects">
          <IconRocket size={13} aria-hidden="true" />
          <strong>{projects}</strong>
          <span>Projects</span>
        </span>
        <span className="group-count-metric group-count-resources">
          <IconFolder size={13} aria-hidden="true" />
          <strong>{resourceCount}</strong>
          <span>Resources</span>
        </span>
      </span>
    </div>
  );
}

export default function GroupProgress({
  currentUser,
  displayName,
  progress,
}: {
  currentUser: string;
  displayName: string;
  progress: UserProgress;
}) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadLeaderboard()
        .then((entries) => {
          if (active) {
            setRows(entries);
            setError("");
            setLoading(false);
          }
        })
        .catch((loadError: unknown) => {
          if (active) {
            setError(
              getErrorMessage(
                loadError,
                "Unable to load the group leaderboard.",
              ),
            );
            setLoading(false);
          }
        });
    };

    refresh();
    window.addEventListener(LEADERBOARD_UPDATED_EVENT, refresh);
    const refreshTimer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.removeEventListener(LEADERBOARD_UPDATED_EVENT, refresh);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const currentEntry: LeaderboardEntry = {
    user_id: currentUser,
    display_name: displayName,
    progress_percent: topicPercent(progress),
    completed_topics: completedTopicCount(progress),
    projects_count:
      rows.find((row) => row.user_id === currentUser)?.projects_count ?? 0,
    resources_count:
      rows.find((row) => row.user_id === currentUser)?.resources_count ?? 0,
    points_total:
      rows.find((row) => row.user_id === currentUser)?.points_total ??
      completedTopicCount(progress) * 10,
  };
  const rankedEntries = [
    ...rows.filter((row) => row.user_id !== currentUser),
    currentEntry,
  ].sort(
    (a, b) =>
      b.points_total - a.points_total ||
      b.progress_percent - a.progress_percent,
  );
  const currentRank =
    rankedEntries.findIndex((entry) => entry.user_id === currentUser) + 1;
  const otherEntries = rankedEntries
    .filter((entry) => entry.user_id !== currentUser)
    .map((entry) => ({
      ...entry,
      display_name: firstName(entry.display_name),
      rank:
        rankedEntries.findIndex((ranked) => ranked.user_id === entry.user_id) +
        1,
    }));
  const selectedEntry =
    rankedEntries.find((entry) => entry.user_id === selectedUserId) ?? null;
  const selectedLearner = selectedEntry
    ? {
        ...selectedEntry,
        display_name:
          selectedEntry.user_id === currentUser
            ? selectedEntry.display_name
            : firstName(selectedEntry.display_name),
      }
    : null;
  const selectedRank = selectedLearner
    ? rankedEntries.findIndex(
        (entry) => entry.user_id === selectedLearner.user_id,
      ) + 1
    : 0;

  return (
    <section className="group-progress-section">
      <div
        className={`group-current-progress ${currentRank === 1 ? "is-top-ranked" : ""}`}
      >
        {currentRank === 1 && <RankConfetti />}
        <div className="group-current-main">
          <div className="group-current-identity">
            <Text className="eyebrow">YOUR PROGRESS</Text>
            <Group className="group-name-row" gap={6} wrap="nowrap">
              <Text className="group-current-rank" fw={700}>
                Rank {currentRank}
              </Text>
              {currentRank === 1 && (
                <span
                  className="group-rank-trophy-medallion"
                  role="img"
                  aria-label="Top ranked learner"
                >
                  <IconTrophy className="group-rank-trophy" size={14} />
                </span>
              )}
            </Group>
          </div>
          <div className="group-current-score">
            <Text size="xs" c="dimmed">
              {currentEntry.progress_percent}%
            </Text>
            <Group gap={4} wrap="nowrap">
              <Badge color="orange" variant="light">
                {currentEntry.points_total} pts
              </Badge>
              <PointsGuide />
            </Group>
          </div>
        </div>
        <div className="group-current-counts">
          <CountMetrics
            topics={currentEntry.completed_topics}
            projects={currentEntry.projects_count}
            resources={currentEntry.resources_count}
          />
        </div>
        <div className="group-current-progress-bar">
          <ProgressBar percent={currentEntry.progress_percent} small />
        </div>
      </div>

      <Group justify="space-between" mb="md">
        <div>
          <Title order={3}>Other Learners</Title>
        </div>
        <Badge
          leftSection={<IconUsers size={15} />}
          color="teal"
          variant="light"
        >
          {otherEntries.length} learners
        </Badge>
      </Group>
      <Stack gap={0} className="group-progress-list">
        {otherEntries.map((row) => (
          <article
            key={row.user_id}
            className={`group-entry ${row.rank === 1 ? "is-top-ranked" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`View ${row.display_name}'s profile`}
            onClick={() => setSelectedUserId(row.user_id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedUserId(row.user_id);
              }
            }}
          >
            {row.rank === 1 && <RankConfetti />}
            <div className="group-entry-summary">
              <Group className="group-entry-identity" gap="sm" wrap="nowrap">
                <div
                  className="group-rank-mark"
                  aria-label={`Rank ${row.rank}`}
                >
                  <Text className="group-rank-label">RANK</Text>
                  <Text className="group-rank-number">
                    {String(row.rank).padStart(2, "0")}
                  </Text>
                </div>
                <div className="group-entry-user">
                  <Group className="group-name-row" gap={6} wrap="nowrap">
                    <Text fw={600}>{row.display_name}</Text>
                    {row.rank === 1 && (
                      <span
                        className="group-rank-trophy-medallion"
                        role="img"
                        aria-label="Top ranked learner"
                      >
                        <IconTrophy className="group-rank-trophy" size={14} />
                      </span>
                    )}
                  </Group>
                </div>
              </Group>
              <div className="group-score">
                <Text size="xs" c="dimmed" ta="right">
                  {row.progress_percent}%
                </Text>
                <Badge color="orange" variant="light">
                  {row.points_total} pts
                </Badge>
              </div>
            </div>
            <div className="group-entry-counts">
              <CountMetrics
                topics={row.completed_topics}
                projects={row.projects_count}
                resources={row.resources_count}
              />
            </div>
            <div className="group-entry-progress">
              <ProgressBar percent={row.progress_percent} small />
            </div>
          </article>
        ))}
      </Stack>
      {loading && (
        <Text size="xs" c="dimmed" mt="sm">
          Loading other learners...
        </Text>
      )}
      {error && (
        <Alert mt="sm" color="red" icon={<IconAlertCircle size={18} />}>
          Unable to load other learners: {error}
        </Alert>
      )}
      {!loading && !error && otherEntries.length === 0 && (
        <Text size="xs" c="dimmed" mt="sm">
          No other group progress yet.
        </Text>
      )}
      <LearnerProfileModal
        learner={selectedLearner}
        rank={selectedRank}
        onClose={() => setSelectedUserId(null)}
      />
    </section>
  );
}
