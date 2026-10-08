import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Card,
  Checkbox,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBrandGithub,
  IconExternalLink,
  IconRocket,
  IconTrophy,
} from "@tabler/icons-react";
import { ROADMAP } from "../data/roadmap";
import { loadUserProjects } from "../projects";
import type { UserProject } from "../projects";
import { getErrorMessage, loadUserProgress } from "../storage";
import type { LeaderboardEntry, UserProgress } from "../storage";
import ProgressBar from "./ProgressBar";
import RankConfetti from "./RankConfetti";

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
                  const isCompleted = progress.completedTopics.includes(
                    topic.id,
                  );
                  return (
                    <Checkbox
                      key={topic.id}
                      className={`learner-profile-topic ${isCompleted ? "is-completed" : ""}`}
                      checked={isCompleted}
                      disabled
                      label={topic.title}
                    />
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
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {moduleProjects.map((project) => (
                <Card
                  className="learner-profile-project"
                  key={project.id}
                  radius="md"
                  withBorder
                >
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      size={28}
                      radius="sm"
                      color="teal"
                      variant="light"
                    >
                      <IconRocket size={15} />
                    </ThemeIcon>
                    <Text fw={600} size="sm" lineClamp={1}>
                      {project.title}
                    </Text>
                  </Group>
                  {project.description && (
                    <Text size="xs" c="dimmed" mt={4}>
                      {project.description}
                    </Text>
                  )}
                  <Group gap="sm" mt="xs">
                    {project.live_url && (
                      <Anchor
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                      >
                        <Group gap={4} wrap="nowrap">
                          <IconExternalLink size={13} />
                          <span>Live</span>
                        </Group>
                      </Anchor>
                    )}
                    {project.github_url && (
                      <Anchor
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                      >
                        <Group gap={4} wrap="nowrap">
                          <IconBrandGithub size={13} />
                          <span>GitHub</span>
                        </Group>
                      </Anchor>
                    )}
                  </Group>
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
                <Badge color="orange" variant="light" size="lg">
                  {learner.points_total} pts
                </Badge>
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
