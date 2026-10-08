import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBrandGithub,
  IconExternalLink,
  IconTrophy,
} from "@tabler/icons-react";
import { ROADMAP } from "../data/roadmap";
import { loadUserProjects } from "../projects";
import type { UserProject } from "../projects";
import { getErrorMessage, loadUserProgress } from "../storage";
import type { LeaderboardEntry, UserProgress } from "../storage";
import {
  completedTopicCount,
  formatTopicDuration,
  formatTopicTimeRemaining,
  topicCountdown,
} from "../progress";
import ProgressBar from "./ProgressBar";
import RankConfetti from "./RankConfetti";
import PointsGuide from "./PointsGuide";

function LearnerRoadmap({ progress }: { progress: UserProgress }) {
  const totalTopics = ROADMAP.reduce(
    (total, module) => total + module.topics.length,
    0,
  );

  return (
    <section className="learner-profile-roadmap">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Roadmap</Title>
        <Text size="sm" c="dimmed">
          {progress.completedTopics.length}/{totalTopics} topics complete
          {completedTopicCount(progress)}/{totalTopics} topics complete
        </Text>
      </Group>
      <Stack gap="sm">
        {ROADMAP.map((module, index) => {
          const completed = module.topics.filter((topic) =>
            progress.completedTopics.includes(topic.id),
          ).length;
          const percent = Math.round((completed / module.topics.length) * 100);

          return (
            <Card
              key={module.id}
              className="learner-profile-module"
              radius="md"
              withBorder
            >
              <Group justify="space-between" mb="xs">
                <div>
                  <Text className="eyebrow">
                    MODULE {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Title order={4}>{module.title}</Title>
                </div>
                <Badge color="gray" variant="light">
                  {completed}/{module.topics.length}
                </Badge>
              </Group>
              <ProgressBar percent={percent} small />
              <Stack gap={0} mt="xs">
                {module.topics.map((topic) => {
                  const detail = progress.topicDetails[topic.id] ?? {
                    status: progress.completedTopics.includes(topic.id)
                      ? "complete"
                      : "not_started",
                    durationHours: 24,
                    startedAt: null,
                  };
                  const timeRemaining = topicCountdown(
                    detail.startedAt,
                    detail.durationHours,
                  );
                  return (
                    <Group
                      key={topic.id}
                      className="learner-profile-topic"
                      justify="space-between"
                      wrap="nowrap"
                      gap="xs"
                    >
                      <Text size="sm">{topic.title}</Text>
                      <Group gap="xs" wrap="nowrap">
                        <Badge
                          color={
                            detail.status === "complete"
                              ? "teal"
                              : detail.status === "in_progress"
                                ? "orange"
                                : "gray"
                          }
                          variant="light"
                        >
                          {detail.status === "not_started"
                            ? "Not started"
                            : detail.status === "in_progress"
                              ? "In progress"
                              : "Complete"}
                        </Badge>
                        <Text
                          size="xs"
                          c="dimmed"
                          className="learner-topic-days"
                        >
                          {detail.status === "in_progress" &&
                          timeRemaining !== null
                            ? formatTopicTimeRemaining(timeRemaining)
                            : formatTopicDuration(detail.durationHours)}
                        </Text>
                      </Group>
                    </Group>
                  );
                })}
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}

function LearnerProjects({ projects }: { projects: UserProject[] }) {
  if (projects.length === 0) {
    return (
      <Text className="resource-empty-state" c="dimmed" size="sm">
        No projects added yet.
      </Text>
    );
  }

  return (
    <Stack gap="lg" className="learner-profile-projects-tab">
      {ROADMAP.map((module, index) => {
        const moduleProjects = projects.filter(
          (project) => project.module_id === module.id,
        );
        if (moduleProjects.length === 0) return null;

        return (
          <section className="learner-profile-projects" key={module.id}>
            <Group justify="space-between" mb="xs">
              <div>
                <Text className="eyebrow">
                  MODULE {String(index + 1).padStart(2, "0")}
                </Text>
                <Title order={4}>{module.title}</Title>
              </div>
              <Badge color="gray" variant="light">
                {moduleProjects.length} projects
              </Badge>
            </Group>
            <SimpleGrid cols={1} spacing="xs">
              {moduleProjects.map((project) => (
                <Card
                  className="learner-project-card"
                  key={project.id}
                  radius="md"
                  withBorder
                >
                  <div className="learner-project-copy">
                    <Title order={4}>{project.title}</Title>
                    {project.description && (
                      <Text c="dimmed" size="sm">
                        {project.description}
                      </Text>
                    )}
                  </div>
                  {(project.live_url || project.github_url) && (
                    <Group gap="xs">
                      {project.live_url && (
                        <Button
                          component="a"
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="light"
                          size="xs"
                          leftSection={<IconExternalLink size={14} />}
                        >
                          Live Project
                        </Button>
                      )}
                      {project.github_url && (
                        <Button
                          component="a"
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="default"
                          size="xs"
                          leftSection={<IconBrandGithub size={14} />}
                        >
                          GitHub
                        </Button>
                      )}
                    </Group>
                  )}
                </Card>
              ))}
            </SimpleGrid>
          </section>
        );
      })}
    </Stack>
  );
}

export default function LearnerProfileModal({
  learner,
  rank,
  onClose,
}: {
  learner: LeaderboardEntry | null;
  rank: number;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [activeTab, setActiveTab] = useState<string>("roadmap");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!learner) return;

    let active = true;
    setActiveTab("roadmap");
    setLoading(true);
    setError("");
    Promise.all([
      loadUserProgress(learner.user_id),
      loadUserProjects(learner.user_id),
    ])
      .then(([nextProgress, nextProjects]) => {
        if (active) {
          setProgress(nextProgress);
          setProjects(nextProjects);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getErrorMessage(
              loadError,
              "Unable to load this learner's profile.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [learner?.user_id]);

  return (
    <Modal
      opened={learner !== null}
      onClose={onClose}
      title="Learner profile"
      centered
      size="xl"
      classNames={{ body: "learner-profile-modal-body" }}
    >
      {learner && (
        <Stack gap="lg">
          <Card
            className={`learner-profile-summary ${rank === 1 ? "is-top-ranked" : ""}`}
            radius="md"
            withBorder
          >
            {rank === 1 && <RankConfetti />}
            <Group
              className="learner-profile-summary-content"
              justify="space-between"
              align="center"
              wrap="wrap"
            >
              <Group gap="md">
                <div className="group-rank-mark" aria-label={`Rank ${rank}`}>
                  <Text className="group-rank-label">RANK</Text>
                  <Text className="group-rank-number">
                    {String(rank).padStart(2, "0")}
                  </Text>
                </div>
                <div>
                  <Group className="group-name-row" gap={6} wrap="nowrap">
                    <Title order={3}>{learner.display_name}</Title>
                    {rank === 1 && (
                      <span
                        className="group-rank-trophy-medallion"
                        role="img"
                        aria-label="Top ranked learner"
                      >
                        <IconTrophy className="group-rank-trophy" size={14} />
                      </span>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {learner.completed_topics} topics · {learner.projects_count}{" "}
                    projects
                  </Text>
                </div>
              </Group>
              <div className="learner-profile-score">
                <Text size="sm" c="dimmed">
                  {learner.progress_percent}% roadmap
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="orange" variant="light" size="lg">
                    {learner.points_total} pts
                  </Badge>
                  <PointsGuide />
                </Group>
              </div>
            </Group>
            <div className="learner-profile-progress learner-profile-summary-content">
              <ProgressBar percent={learner.progress_percent} small />
            </div>
          </Card>

          {error ? (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          ) : loading || !progress ? (
            <Group justify="center" py="xl">
              <Loader color="teal" size="sm" />
              <Text c="dimmed" size="sm">
                Loading learner details...
              </Text>
            </Group>
          ) : (
            <Tabs
              value={activeTab}
              onChange={(value) => value && setActiveTab(value)}
              keepMounted={false}
              className="app-tabs learner-profile-tabs"
            >
              <Tabs.List grow>
                <Tabs.Tab value="roadmap">Roadmap</Tabs.Tab>
                <Tabs.Tab value="projects">Projects</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="roadmap" pt="md">
                <LearnerRoadmap progress={progress} />
              </Tabs.Panel>
              <Tabs.Panel value="projects" pt="md">
                <LearnerProjects projects={projects} />
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      )}
    </Modal>
  );
}
