import {
  Badge,
  Card,
  Group,
  Select,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCode, IconRocket } from "@tabler/icons-react";
import { PROJECTS } from "../data/roadmap";
import type { ProjectStatus } from "../storage";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

interface Props {
  statuses: Record<string, ProjectStatus>;
  onChange: (projectId: string, status: ProjectStatus) => void;
}

export default function Projects({ statuses, onChange }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {PROJECTS.map((p) => {
        const status = statuses[p.id] ?? "not-started";
        const ProjectIcon =
          p.id === "p5" || p.id === "p6" ? IconCode : IconRocket;
        return (
          <Card key={p.id} className="project-card" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <ThemeIcon color="teal" variant="light" size={42} radius="md">
                <ProjectIcon size={21} stroke={1.8} />
              </ThemeIcon>
              <Badge
                color={
                  status === "completed"
                    ? "teal"
                    : status === "in-progress"
                      ? "orange"
                      : "gray"
                }
                variant="light"
              >
                {STATUS_LABELS[status]}
              </Badge>
            </Group>
            <div className="project-copy">
              <Title order={3}>{p.title}</Title>
              <Text c="dimmed" size="sm">
                {p.description}
              </Text>
            </div>
            <Select
              className="project-select"
              label="Project status"
              value={status}
              onChange={(value) => {
                if (value) onChange(p.id, value as ProjectStatus);
              }}
              aria-label={`Status for ${p.title}`}
              data={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              allowDeselect={false}
            ></Select>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
