import { useEffect, useState } from "react";
import {
  Alert,
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Notification,
  Portal,
  Select,
  Stack,
  ThemeIcon,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBook2,
  IconCircleCheck,
  IconExternalLink,
  IconFolder,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { User } from "../data/users";
import {
  addTopicResource,
  deleteTopicResource,
  loadTopicResources,
  updateTopicResource,
} from "../resources";
import type { ResourceType, TopicResource } from "../resources";
import { getErrorMessage } from "../storage";
import { notifyLeaderboardUpdated } from "../leaderboardEvents";

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "article", label: "Article" },
  { value: "course", label: "Course" },
  { value: "other", label: "Other" },
];

export default function TopicResources({
  topicId,
  topicTitle,
  user,
  resourceCount,
  onCountChange,
  openRequest = 0,
}: {
  topicId: string;
  topicTitle: string;
  user: User;
  resourceCount: number;
  onCountChange: (topicId: string, delta: number) => void;
  openRequest?: number;
}) {
  const [opened, setOpened] = useState(false);
  const [dismissedOpenRequest, setDismissedOpenRequest] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [editingResource, setEditingResource] = useState<TopicResource | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("video");
  const [description, setDescription] = useState("");
  const hasChanges = editingResource
    ? title.trim() !== editingResource.title ||
      url.trim() !== editingResource.url ||
      resourceType !== editingResource.resource_type ||
      description.trim() !== (editingResource.description ?? "")
    : true;
  const modalOpened = opened || openRequest > dismissedOpenRequest;

  useEffect(() => {
    if (!modalOpened) return;

    let active = true;
    setLoading(true);
    setError("");
    loadTopicResources(topicId)
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getErrorMessage(
              loadError,
              "Unable to load resources. Check the Supabase resource table setup.",
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
  }, [modalOpened, topicId]);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function closeModal() {
    setOpened(false);
    setDismissedOpenRequest(openRequest);
    setShowForm(false);
    setEditingResource(null);
    setConfirmDeleteId(null);
    setError("");
    setSuccessMessage("");
  }

  function resetForm() {
    setShowForm(false);
    setEditingResource(null);
    setTitle("");
    setUrl("");
    setResourceType("video");
    setDescription("");
  }

  function beginAddingResource() {
    resetForm();
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function beginEditing(resource: TopicResource) {
    setEditingResource(resource);
    setTitle(resource.title);
    setUrl(resource.url);
    setResourceType(resource.resource_type);
    setDescription(resource.description ?? "");
    setConfirmDeleteId(null);
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      setError("Enter a valid web link.");
      return;
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      setError("Resource links must start with http:// or https://.");
      return;
    }

    setSaving(true);
    const wasEditing = Boolean(editingResource);
    try {
      const changes = {
        title,
        url: parsedUrl.toString(),
        resourceType,
        description,
      };

      if (editingResource) {
        const updated = await updateTopicResource(editingResource.id, changes);
        setResources((current) =>
          current.map((resource) =>
            resource.id === updated.id ? updated : resource,
          ),
        );
      } else {
        const created = await addTopicResource({
          topicId,
          ...changes,
          userId: user.id,
          displayName: user.displayName,
        });
        setResources((current) => [created, ...current]);
        onCountChange(topicId, 1);
        notifyLeaderboardUpdated();
      }

      resetForm();
      setSuccessMessage(
        wasEditing
          ? "Resource updated successfully."
          : "Resource added successfully.",
      );
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save this resource."));
    } finally {
      setSaving(false);
    }
  }

  async function removeResource(resourceId: string) {
    setError("");
    setSuccessMessage("");
    setDeletingId(resourceId);
    try {
      await deleteTopicResource(resourceId);
      setResources((current) =>
        current.filter((resource) => resource.id !== resourceId),
      );
      onCountChange(topicId, -1);
      notifyLeaderboardUpdated();
      setConfirmDeleteId(null);
      setSuccessMessage("Resource removed successfully.");
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, "Unable to remove this resource."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {successMessage && (
        <Portal>
          <Notification
            className="resource-toast"
            color="teal"
            icon={<IconCircleCheck size={18} />}
            title="Success"
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Notification>
        </Portal>
      )}

      <Tooltip label={`Resources for ${topicTitle}`}>
        <Button
          className="topic-resource-button"
          variant="default"
          size="xs"
          leftSection={<IconFolder size={15} stroke={1.8} />}
          aria-label={`Resources for ${topicTitle}: ${resourceCount} resources`}
          onClick={() => setOpened(true)}
        >
          {resourceCount}
        </Button>
      </Tooltip>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Group
            className="resource-modal-title"
            justify="space-between"
            wrap="nowrap"
          >
            <Text fw={700}>
              {showForm
                ? editingResource
                  ? "Update Resource"
                  : "Add Resource"
                : "Resources"}
            </Text>
            <Group gap="xs" wrap="nowrap">
              {!showForm && (
                <Button
                  size="xs"
                  leftSection={<IconPlus size={15} />}
                  onClick={beginAddingResource}
                >
                  Add Resource
                </Button>
              )}
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Close resources"
                onClick={closeModal}
              >
                <IconX size={20} />
              </ActionIcon>
            </Group>
          </Group>
        }
        withCloseButton={false}
        styles={{
          header: { width: "100%", display: "flex", alignItems: "center" },
          title: { flex: "1 1 0%", width: "100%", minWidth: 0 },
        }}
        size="lg"
        centered
      >
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          {showForm && (
            <form className="resource-form" onSubmit={handleSubmit}>
              <TextInput
                label="Resource title"
                placeholder="e.g. Intro to neural networks"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                maxLength={120}
                required
              />
              <TextInput
                label="Link"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(event) => setUrl(event.currentTarget.value)}
                required
              />
              <Select
                label="Resource type"
                data={RESOURCE_TYPES}
                value={resourceType}
                onChange={(value) => {
                  if (value) setResourceType(value as ResourceType);
                }}
                allowDeselect={false}
              />
              <Textarea
                label="Note (optional)"
                placeholder="What makes this useful?"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                maxLength={500}
                autosize
                minRows={2}
                maxRows={4}
              />
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    resetForm();
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} disabled={!hasChanges}>
                  Save Resource
                </Button>
              </Group>
            </form>
          )}

          {!showForm &&
            (loading ? (
              <Group justify="center" py="lg">
                <Loader size="sm" color="teal" />
              </Group>
            ) : resources.length === 0 ? (
              <Stack className="resource-empty-state" align="center" gap="sm">
                <ThemeIcon size={44} radius="xl" color="teal" variant="light">
                  <IconBook2 size={22} />
                </ThemeIcon>
                <Text fw={700}>Share something that helped you learn</Text>
                <Text size="sm" c="dimmed" maw={360}>
                  Share a useful video, guide, or article to help the next
                  learner and earn{" "}
                  <Text span fw={700} c="teal">
                    50 points
                  </Text>
                  .
                </Text>
                <Button
                  size="sm"
                  leftSection={<IconPlus size={16} />}
                  onClick={beginAddingResource}
                >
                  Share first resource
                </Button>
              </Stack>
            ) : (
              <Stack gap={0} className="resource-list">
                {resources.map((resource) => (
                  <article className="resource-item" key={resource.id}>
                    <Group justify="space-between" align="flex-start" gap="md">
                      <div className="resource-item-copy">
                        <Group gap="xs" mb={4}>
                          <Badge size="xs" variant="light" color="teal">
                            {RESOURCE_TYPES.find(
                              (type) => type.value === resource.resource_type,
                            )?.label ?? "Other"}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Added by {resource.added_by_name}
                          </Text>
                        </Group>
                        <Anchor
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          fw={600}
                          className="resource-link"
                        >
                          {resource.title}
                        </Anchor>
                        {resource.description && (
                          <Text size="sm" c="dimmed" mt={4}>
                            {resource.description}
                          </Text>
                        )}
                      </div>
                      <Group className="resource-actions" gap={4} wrap="nowrap">
                        {resource.added_by === user.id && (
                          <>
                            <Tooltip label="Edit resource">
                              <ActionIcon
                                variant="subtle"
                                color="teal"
                                size="sm"
                                className="resource-action"
                                aria-label={`Edit ${resource.title}`}
                                onClick={() => beginEditing(resource)}
                              >
                                <IconPencil size={17} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Remove resource">
                              <ActionIcon
                                variant="subtle"
                                color="teal"
                                size="sm"
                                className="resource-action"
                                aria-label={`Remove ${resource.title}`}
                                onClick={() => {
                                  setError("");
                                  setConfirmDeleteId((current) =>
                                    current === resource.id
                                      ? null
                                      : resource.id,
                                  );
                                }}
                              >
                                <IconTrash size={17} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                        <ActionIcon
                          component="a"
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="subtle"
                          color="teal"
                          size="sm"
                          className="resource-action"
                          aria-label={`Open ${resource.title}`}
                        >
                          <IconExternalLink size={17} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    {confirmDeleteId === resource.id && (
                      <Group
                        className="resource-delete-confirm"
                        justify="space-between"
                        mt="sm"
                      >
                        <Text size="sm">Remove this shared resource?</Text>
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
                            loading={deletingId === resource.id}
                            onClick={() => void removeResource(resource.id)}
                          >
                            Remove
                          </Button>
                        </Group>
                      </Group>
                    )}
                  </article>
                ))}
              </Stack>
            ))}
        </Stack>
      </Modal>
    </>
  );
}
