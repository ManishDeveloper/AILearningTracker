import { PROJECTS } from "../data/roadmap";
import { useEffect, useState } from "react";
import { Alert, Avatar, Badge, Group, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconUsers } from "@tabler/icons-react";
import { completedProjects, topicPercent } from "../progress";
import { getErrorMessage, loadLeaderboard } from "../storage";
import type { LeaderboardEntry, UserProgress } from "../storage";
import ProgressBar from "./ProgressBar";

const SHOW_DEMO_PEERS = import.meta.env.DEV;
const DEMO_PEERS: LeaderboardEntry[] = [
  {
    user_id: "demo-peer-aarav",
    display_name: "Aarav Demo",
    progress_percent: 68,
    completed_projects: 3,
  },
  {
    user_id: "demo-peer-maya",
    display_name: "Maya Demo",
    progress_percent: 46,
    completed_projects: 2,
  },
  {
    user_id: "demo-peer-rehan",
    display_name: "Rehan Demo",
    progress_percent: 24,
    completed_projects: 1,
  },
  {
    user_id: "demo-peer-diya",
    display_name: "Diya Demo",
    progress_percent: 9,
    completed_projects: 0,
  },
  {
    user_id: "demo-peer-nisha",
    display_name: "Nisha Demo",
    progress_percent: 58,
    completed_projects: 2,
  },
  {
    user_id: "demo-peer-kabir",
    display_name: "Kabir Demo",
    progress_percent: 37,
    completed_projects: 1,
  },
  {
    user_id: "demo-peer-zoya",
    display_name: "Zoya Demo",
    progress_percent: 15,
    completed_projects: 1,
  },
  {
    user_id: "demo-peer-rohan",
    display_name: "Rohan Demo",
    progress_percent: 4,
    completed_projects: 0,
  },
];

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

  useEffect(() => {
    let active = true;
    loadLeaderboard()
      .then((entries) => {
        if (active) {
          setRows(entries.filter((entry) => entry.user_id !== currentUser));
          setLoading(false);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getErrorMessage(loadError, "Unable to load the group leaderboard."),
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const peers = [...rows].sort(
    (a, b) =>
      b.progress_percent - a.progress_percent ||
      b.completed_projects - a.completed_projects,
  );
  const allPeers = [
    ...peers,
    ...(SHOW_DEMO_PEERS
      ? DEMO_PEERS.filter(
          (demo) => !peers.some((peer) => peer.user_id === demo.user_id),
        )
      : []),
  ].sort(
    (a, b) =>
      b.progress_percent - a.progress_percent ||
      b.completed_projects - a.completed_projects,
  );
  const entries: LeaderboardEntry[] = [
    {
      user_id: currentUser,
      display_name: displayName,
      progress_percent: topicPercent(progress),
      completed_projects: completedProjects(progress),
    },
    ...allPeers,
  ];

  return (
    <section className="group-progress-section">
      <Group justify="space-between" mb="md">
        <div>
          <Text className="eyebrow">LEARN TOGETHER</Text>
          <Title order={3}>Group progress</Title>
        </div>
        <Badge
          leftSection={<IconUsers size={15} />}
          color="teal"
          variant="light"
        >
          {entries.length} learners
        </Badge>
      </Group>
      <Stack gap={0} className="group-progress-list">
        {entries.map((row) => (
          <article
            key={row.user_id}
            className={`group-entry ${row.user_id === currentUser ? "is-current" : ""}`}
          >
            <Group justify="space-between" align="center" mb="xs" wrap="wrap">
              <Group gap="sm">
                <Avatar
                  color={row.user_id === currentUser ? "teal" : "orange"}
                  radius="xl"
                >
                  {row.display_name.slice(0, 2).toUpperCase()}
                </Avatar>
                <div>
                  <Text fw={600}>
                    {row.display_name}
                    {row.user_id === currentUser
                      ? " (you)"
                      : row.user_id.startsWith("demo-peer-")
                        ? " (demo)"
                        : ""}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {row.completed_projects}/{PROJECTS.length} projects
                  </Text>
                </div>
              </Group>
              <Text fw={700} className="group-percent">
                {row.progress_percent}%
              </Text>
            </Group>
            <ProgressBar percent={row.progress_percent} small />
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
      {!loading && !error && allPeers.length === 0 && (
        <Text size="xs" c="dimmed" mt="sm">
          No other group progress yet.
        </Text>
      )}
    </section>
  );
}
