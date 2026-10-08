import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Notification,
  Portal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBrandGithub,
  IconCircleCheck,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconRocket,
  IconTrophy,
  IconTrash,
} from "@tabler/icons-react";
import type { User } from "../data/users";
import { ROADMAP } from "../data/roadmap";
import {
  addUserProject,
  deleteUserProject,
  loadAllUserProjects,
  updateUserProject,
} from "../projects";
import type { ProjectInput, UserProject } from "../projects";
import { getErrorMessage, loadLeaderboard } from "../storage";
import { notifyLeaderboardUpdated } from "../leaderboardEvents";

interface Props {
  user: User;
}

function parseOptionalUrl(value: string, label: string): string | null {
  if (!value.trim()) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid web link.`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${label} must start with http:// or https://.`);
  }

  return parsedUrl.toString();
}

export default function Projects({ user }: Props) {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [projectUsers, setProjectUsers] = useState<
    { userId: string; displayName: string; label: string }[]
  >([]);
  const [projectFilter, setProjectFilter] = useState(user.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<UserProject | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState(ROADMAP[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    let active = true;
    Promise.all([loadAllUserProjects(), loadLeaderboard()])
      .then(([items, learners]) => {
        if (active) setProjects(items);
        if (active) {
          const names = new Map(
            learners.map((learner) => [learner.user_id, learner.display_name]),
          );
          for (const project of items) {
            if (!names.has(project.user_id)) {
              names.set(project.user_id, project.display_name);
            }
          }
          names.set(user.id, user.displayName);
          const otherUsers = Array.from(names)
            .filter(([userId]) => userId !== user.id)
            .map(([userId, displayName]) => ({
              userId,
              displayName,
              label: displayName,
            }));
          setProjectUsers([
            {
              userId: user.id,
              displayName: user.displayName,
              label: "My Projects",
            },
            ...otherUsers,
          ]);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Unable to load projects."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id, user.displayName]);

  const projectFilterOptions = [
    { value: user.id, label: "My Projects" },
    ...projectUsers
      .filter((projectUser) => projectUser.userId !== user.id)
      .map(({ userId, displayName }) => ({
        value: userId,
        label: displayName,
      })),
  ];

  const visibleProjects = projects.filter((project) => {
    return project.user_id === projectFilter;
  });
  const selectedLearnerName =
    projectUsers.find((learner) => learner.userId === projectFilter)
      ?.displayName ?? "this learner";

  function resetForm() {
    setOpened(false);
    setEditingProject(null);
    setModuleId(ROADMAP[0]?.id ?? "");
    setTitle("");
    setLiveUrl("");
    setGithubUrl("");
    setDescription("");
    setError("");
  }

  function startEdit(project: UserProject) {
    setEditingProject(project);
    setModuleId(project.module_id);
    setTitle(project.title);
    setLiveUrl(project.live_url ?? "");
    setGithubUrl(project.github_url ?? "");
    setDescription(project.description ?? "");
    setError("");
    setSuccessMessage("");
    setConfirmDeleteId(null);
    setOpened(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    let normalizedLiveUrl: string | null;
    let normalizedGithubUrl: string | null;
    try {
      normalizedLiveUrl = parseOptionalUrl(liveUrl, "Live link");
      normalizedGithubUrl = parseOptionalUrl(githubUrl, "GitHub link");
      if (!normalizedGithubUrl) {
        throw new Error("GitHub link is required.");
      }
    } catch (urlError: unknown) {
      setError(getErrorMessage(urlError, "Check the project links."));
      return;
    }

    const projectInput: ProjectInput = {
      moduleId,
      title,
      liveUrl: normalizedLiveUrl ?? "",
      githubUrl: normalizedGithubUrl ?? "",
      description,
      userId: user.id,
      displayName: user.displayName,
    };

    setSaving(true);
    try {
      const wasEditing = Boolean(editingProject);
      if (editingProject) {
        const updated = await updateUserProject(
          editingProject.id,
          projectInput,
        );
        setProjects((current) =>
          current.map((project) =>
            project.id === updated.id ? updated : project,
          ),
        );
      } else {
        const created = await addUserProject(projectInput);
        setProjects((current) => [created, ...current]);
        setProjectFilter(user.id);
        notifyLeaderboardUpdated();
      }
      resetForm();
      setSuccessMessage(
        wasEditing
          ? "Project updated successfully."
          : "Project added successfully.",
      );
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save this project."));
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(projectId: string) {
    setError("");
    setSuccessMessage("");
    setDeletingId(projectId);
    try {
      await deleteUserProject(projectId);
      setProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
      setConfirmDeleteId(null);
      notifyLeaderboardUpdated();
      setSuccessMessage("Project removed successfully.");
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, "Unable to remove this project."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {successMessage && (
        <Portal>
          <Notification
            className="project-toast"
            color="teal"
            icon={<IconCircleCheck size={18} />}
            title="Success"
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Notification>
        </Portal>
      )}
      <Stack gap="lg" className="projects-page">
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Title order={2}>Projects</Title>
            <Group className="projects-subheading" gap="xs" wrap="wrap">
              <Text size="sm" c="dimmed">
                Add a project and share what you built.
              </Text>
              <Badge
                color="orange"
                variant="light"
                leftSection={<IconTrophy size={13} />}
              >
                +100 points
              </Badge>
            </Group>
          </div>
          <Group gap="sm" wrap="wrap">
            <Select
              aria-label="Filter projects by learner"
              data={projectFilterOptions}
              value={projectFilter}
              onChange={(value) => value && setProjectFilter(value)}
              allowDeselect={false}
              disabled={loading}
              w={190}
            />
            <Button
              leftSection={<IconPlus size={17} />}
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setEditingProject(null);
                setModuleId(ROADMAP[0]?.id ?? "");
                setTitle("");
                setLiveUrl("");
                setGithubUrl("");
                setDescription("");
                setOpened(true);
              }}
            >
              Add Project
            </Button>
          </Group>
        </Group>

        {error && !opened && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Text c="dimmed">Loading projects...</Text>
        ) : error && !opened ? null : visibleProjects.length === 0 ? (
          <div className="projects-empty-state">
            <ThemeIcon size={48} radius="xl" color="teal" variant="light">
              <IconRocket size={23} />
            </ThemeIcon>
            <Title order={3}>
              {projectFilter === user.id
                ? "No projects added yet"
                : "No projects found"}
            </Title>
            <Text c="dimmed" size="sm">
              {projectFilter === user.id
                ? "Add a project to keep your work organized by roadmap module."
                : `No projects from ${selectedLearnerName} yet.`}
            </Text>
          </div>
        ) : (
          <Accordion
            key={projectFilter}
            className="projects-accordion"
            multiple
            variant="separated"
            defaultValue={[
              ROADMAP.find((module) =>
                visibleProjects.some(
                  (project) => project.module_id === module.id,
                ),
              )?.id ?? "",
            ].filter(Boolean)}
          >
            {ROADMAP.map((module, index) => {
              const moduleProjects = visibleProjects.filter(
                (project) => project.module_id === module.id,
              );
              return (
                <Accordion.Item
                  className="project-module-accordion"
                  key={module.id}
                  value={module.id}
                >
                  <Accordion.Control className="project-module-control">
                    <Group justify="space-between" wrap="nowrap" pr="sm">
                      <div>
                        <Text className="eyebrow">
                          MODULE {String(index + 1).padStart(2, "0")}
                        </Text>
                        <Title order={3}>{module.title}</Title>
                      </div>
                      <Badge color="gray" variant="light">
                        {moduleProjects.length} projects
                      </Badge>
                    </Group>
                  </Accordion.Control>

                  <Accordion.Panel className="project-module-panel">
                    {moduleProjects.length === 0 ? (
                      <Text
                        className="project-module-empty"
                        c="dimmed"
                        size="sm"
                      >
                        No projects in this module yet.
                      </Text>
                    ) : (
                      <SimpleGrid cols={1} spacing="sm">
                        {moduleProjects.map((project) => (
                          <Card
                            key={project.id}
                            className="learner-project-card"
                            radius="md"
                            withBorder
                          >
                            <div className="learner-project-copy">
                              <Group
                                className="project-title-row"
                                justify="space-between"
                                align="center"
                                wrap="nowrap"
                              >
                                <Title order={4}>{project.title}</Title>
                                {project.user_id === user.id && (
                                  <Group
                                    className="project-card-actions"
                                    gap="xs"
                                    wrap="nowrap"
                                  >
                                    <Tooltip label="Edit project">
                                      <ActionIcon
                                        variant="subtle"
                                        color="teal"
                                        aria-label={`Edit ${project.title}`}
                                        onClick={() => startEdit(project)}
                                      >
                                        <IconPencil size={17} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Remove project">
                                      <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        aria-label={`Remove ${project.title}`}
                                        onClick={() =>
                                          setConfirmDeleteId(project.id)
                                        }
                                      >
                                        <IconTrash size={17} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                )}
                              </Group>
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
                            {confirmDeleteId === project.id && (
                              <Group
                                className="project-delete-confirm"
                                justify="space-between"
                              >
                                <Text size="xs">Remove this project?</Text>
                                <Group gap="xs">
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => setConfirmDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="xs"
                                    color="red"
                                    loading={deletingId === project.id}
                                    onClick={() =>
                                      void removeProject(project.id)
                                    }
                                  >
                                    Remove
                                  </Button>
                                </Group>
                              </Group>
                            )}
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}

        <Modal
          opened={opened}
          onClose={resetForm}
          title={editingProject ? "Edit project" : "Add project"}
          centered
          size="lg"
        >
          <Stack gap="md">
            {error && (
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                {error}
              </Alert>
            )}
            <form className="resource-form" onSubmit={handleSubmit}>
              <Select
                label="Roadmap module"
                data={ROADMAP.map((module) => ({
                  value: module.id,
                  label: module.title,
                }))}
                value={moduleId}
                onChange={(value) => value && setModuleId(value)}
                allowDeselect={false}
                required
              />
              <TextInput
                label="Project title"
                placeholder="e.g. Study notes assistant"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                maxLength={120}
                required
              />
              <TextInput
                label="GitHub Link"
                type="url"
                placeholder="https://github.com/you/project"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.currentTarget.value)}
                required
              />
              <TextInput
                label="Live Project Link (optional)"
                type="url"
                placeholder="https://your-project.example"
                value={liveUrl}
                onChange={(event) => setLiveUrl(event.currentTarget.value)}
              />
              <Textarea
                label="Description (optional)"
                placeholder="What does your project do?"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                maxLength={1000}
                autosize
                minRows={2}
                maxRows={5}
              />
              <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingProject ? "Save changes" : "Add Project"}
                </Button>
              </Group>
            </form>
          </Stack>
        </Modal>
      </Stack>
    </>
  );
}
