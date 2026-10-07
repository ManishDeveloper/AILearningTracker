import { ROADMAP } from "../data/roadmap";
import {
  Badge,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBook2,
  IconBrain,
  IconCode,
  IconRefresh,
  IconRobot,
  IconSparkles,
} from "@tabler/icons-react";
import ProgressBar from "./ProgressBar";
import TopicResources from "./TopicResources";
import type { User } from "../data/users";

const MODULE_ICONS = [
  IconCode,
  IconBook2,
  IconBrain,
  IconSparkles,
  IconRobot,
  IconRefresh,
];

interface Props {
  user: User;
  completedTopics: string[];
  onToggle: (topicId: string) => void;
}

export default function Roadmap({ user, completedTopics, onToggle }: Props) {
  return (
    <div className="stack">
      {ROADMAP.map((mod, i) => {
        const done = mod.topics.filter((t) =>
          completedTopics.includes(t.id),
        ).length;
        const pct = Math.round((done / mod.topics.length) * 100);
        const ModuleIcon = MODULE_ICONS[i % MODULE_ICONS.length];
        return (
          <Card key={mod.id} className="roadmap-card" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start" mb="sm">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size={42}
                  radius="md"
                  color={i === 3 ? "orange" : "teal"}
                  variant="light"
                >
                  <ModuleIcon size={21} stroke={1.8} />
                </ThemeIcon>
                <div>
                  <Text className="eyebrow">
                    MODULE {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text fw={700} className="module-title">
                    {mod.title}
                  </Text>
                </div>
              </Group>
              <Badge variant="light" color="gray" radius="sm">
                {mod.duration} · {done}/{mod.topics.length}
              </Badge>
            </Group>
            <ProgressBar percent={pct} small />
            <Stack gap={0} className="topic-list">
              {mod.topics.map((t) => {
                const checked = completedTopics.includes(t.id);
                return (
                  <div className="roadmap-topic-row" key={t.id}>
                    <Checkbox
                      className="roadmap-topic"
                      checked={checked}
                      onChange={() => onToggle(t.id)}
                      label={t.title}
                    />
                    <TopicResources
                      topicId={t.id}
                      topicTitle={t.title}
                      user={user}
                    />
                  </div>
                );
              })}
            </Stack>
          </Card>
        );
      })}
    </div>
  );
}
