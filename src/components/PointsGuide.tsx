import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  Popover,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";

export default function PointsGuide() {
  return (
    <Popover
      position="bottom-end"
      width={340}
      withArrow
      shadow="md"
      withinPortal
      zIndex={1200}
    >
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label="How points are calculated"
          title="How points are calculated"
        >
          <IconInfoCircle size={16} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown className="points-guide-dropdown">
        <Stack gap="xs" className="points-guide-content">
          <Text size="sm" fw={700}>
            How points work
          </Text>
          <Group justify="space-between" gap="lg" wrap="nowrap">
            <Text size="xs">Complete a topic (varies by topic)</Text>
            <Badge color="teal" variant="light">
              Varies
            </Badge>
          </Group>
          <Group justify="space-between" gap="lg" wrap="nowrap">
            <Text size="xs">Add a learning resource</Text>
            <Badge color="teal" variant="light">
              +50
            </Badge>
          </Group>
          <Group justify="space-between" gap="lg" wrap="nowrap">
            <Text size="xs">Add a project</Text>
            <Badge color="teal" variant="light">
              +100
            </Badge>
          </Group>
          <Alert
            className="points-guide-warning"
            color="orange"
            variant="light"
            icon={<IconAlertCircle size={15} />}
            p="xs"
          >
            <Text size="xs">
              Restarting a completed topic or deleting a project/resource
              removes its points. Editing does not award points again.
            </Text>
          </Alert>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
