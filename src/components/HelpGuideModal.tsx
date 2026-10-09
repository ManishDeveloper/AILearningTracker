import { Group, Modal, Text } from "@mantine/core";
import {
  IconBook2,
  IconCode,
  IconRocket,
  IconTrophy,
} from "@tabler/icons-react";

const LEARNING_STEPS = [
  {
    title: "Learn",
    caption: "Start one topic",
    Icon: IconBook2,
  },
  {
    title: "Build",
    caption: "Practice as you go",
    Icon: IconCode,
  },
  {
    title: "Ship",
    caption: "Submit your project",
    Icon: IconRocket,
  },
  {
    title: "Earn",
    caption: "150–300 points",
    Icon: IconTrophy,
  },
];

export default function HelpGuideModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="How the AI tracker works"
      centered
      size="xl"
    >
      <div className="learning-flow">
        <div className="learning-flow-steps">
          {LEARNING_STEPS.map(({ title, caption, Icon }, index) => (
            <section
              className={`learning-flow-step learning-flow-step-${index + 1}`}
              key={title}
            >
              <div className="learning-flow-marker">
                <Icon size={29} stroke={1.8} />
              </div>
              <Text className="learning-flow-title" fw={700}>
                {title}
              </Text>
              <Text className="learning-flow-caption" size="sm">
                {caption}
              </Text>
            </section>
          ))}
        </div>
        <Group className="learning-flow-rewards" gap="sm" wrap="wrap">
          <div className="learning-flow-reward learning-flow-project-reward">
            <IconTrophy size={18} />
            <span>Roadmap project</span>
            <strong>150–300 pts</strong>
          </div>
          <div className="learning-flow-reward learning-flow-resource-reward">
            <IconBook2 size={18} />
            <span>Share a resource</span>
            <strong>+50 pts</strong>
          </div>
        </Group>
        <Text className="learning-flow-note" size="xs">
          Roadmap projects need a GitHub link. Personal projects stay separate.
        </Text>
      </div>
    </Modal>
  );
}
