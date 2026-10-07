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
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconExternalLink,
  IconFolder,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import type { User } from "../data/users";
import { addTopicResource, loadTopicResources } from "../resources";
import type { ResourceType, TopicResource } from "../resources";
import { getErrorMessage } from "../storage";

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
}: {
  topicId: string;
  topicTitle: string;
  user: User;
}) {
  const [opened, setOpened] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("video");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!opened) return;

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
  }, [opened, topicId]);

  function closeModal() {
    setOpened(false);
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

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
    try {
      const created = await addTopicResource({
        topicId,
        title,
        url: parsedUrl.toString(),
        resourceType,
        description,
        userId: user.id,
        displayName: user.displayName,
      });
      setResources((current) => [created, ...current]);
      setTitle("");
      setUrl("");
      setResourceType("video");
      setDescription("");
      setShowForm(false);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save this resource."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        className="topic-resource-button"
        variant="default"
        size="xs"
        leftSection={<IconFolder size={14} stroke={1.8} />}
        aria-label={`Resources for ${topicTitle}`}
        onClick={() => setOpened(true)}
      >
        Resources
      </Button>

      <Modal
        opened={opened}
        onClose={closeModal}
        title={
          <Group
            className="resource-modal-title"
            justify="space-between"
            wrap="nowrap"
          >
            <Text fw={700}>Resources</Text>
            <Group gap="xs" wrap="nowrap">
              {!showForm && (
                <Button
                  size="xs"
                  leftSection={<IconPlus size={15} />}
                  onClick={() => {
                    setError("");
                    setShowForm(true);
                  }}
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
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save resource
                </Button>
              </Group>
            </form>
          )}

          {loading ? (
            <Group justify="center" py="lg">
              <Loader size="sm" color="teal" />
            </Group>
          ) : resources.length === 0 ? (
            <Text className="resource-empty-state" c="dimmed" size="sm">
              No shared resources for this topic yet.
            </Text>
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
                    <Anchor
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${resource.title}`}
                    >
                      <IconExternalLink size={17} />
                    </Anchor>
                  </Group>
                </article>
              ))}
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  );
}
