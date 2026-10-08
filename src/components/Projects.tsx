import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
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
  IconTrash,
} from "@tabler/icons-react";
import type { User } from "../data/users";
import { ROADMAP } from "../data/roadmap";
import {
  addUserProject,
  deleteUserProject,
  loadUserProjects,
  updateUserProject,
} from "../projects";
import type { ProjectInput, UserProject } from "../projects";
import { getErrorMessage } from "../storage";
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
    loadUserProjects(user.id)
      .then((items) => {
        if (active) setProjects(items);
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
  }, [user.id]);

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
        <Group justify="space-between" align="center">
          <div>
            <Text className="eyebrow">BUILD AND SHARE</Text>
            <Title order={2}>Projects</Title>
          </div>
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

        {error && !opened && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Text c="dimmed">Loading projects...</Text>
        ) : error && !opened ? null : projects.length === 0 ? (
          <div className="projects-empty-state">
            <ThemeIcon size={48} radius="xl" color="teal" variant="light">
              <IconRocket size={23} />
            </ThemeIcon>
            <Title order={3}>No projects added yet</Title>
            <Text c="dimmed" size="sm">
              Add a project to keep your work organized by roadmap module.
            </Text>
          </div>
        ) : (
          <Stack gap="xl">
            {ROADMAP.map((module, index) => {
              const moduleProjects = projects.filter(
                (project) => project.module_id === module.id,
              );
              return (
                <section className="project-module-section" key={module.id}>
                  <Group justify="space-between" mb="sm">
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

                  {moduleProjects.length === 0 ? (
                    <Text className="project-module-empty" c="dimmed" size="sm">
                      No projects in this module yet.
                    </Text>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                      {moduleProjects.map((project) => (
                        <Card
                          key={project.id}
                          className="learner-project-card"
                          radius="md"
                          withBorder
                        >
                          <Group justify="space-between" align="flex-start">
                            <ThemeIcon
                              color="teal"
                              variant="light"
                              size={40}
                              radius="md"
                            >
                              <IconRocket size={20} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                              By {project.display_name}
                            </Text>
                          </Group>
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
                          {project.user_id === user.id && (
                            <Group justify="flex-end" gap="xs">
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
                                  onClick={() => setConfirmDeleteId(project.id)}
                                >
                                  <IconTrash size={17} />
                                </ActionIcon>
                              </Tooltip>
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
                                  onClick={() => void removeProject(project.id)}
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
                </section>
              );
            })}
          </Stack>
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
