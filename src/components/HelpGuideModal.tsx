import { Modal, Stack, Text } from "@mantine/core";

const GUIDE_SECTIONS = [
  {
    title: "Follow your roadmap",
    body: "Open a module and start a topic. Work on one topic at a time, set a time estimate, then mark it complete to record your progress.",
  },
  {
    title: "Earn points",
    body: "Each topic has its own point value, shown beside its title. Adding a learning resource earns 20 points; adding a project earns 100 points.",
  },
  {
    title: "Share what you learn",
    body: "Use a topic's Resources button to share a helpful link. Add projects from the Projects tab so your cohort can see what you built.",
  },
  {
    title: "Explore cohort activity",
    body: "Filter the Activity feed by learning, projects, resources, or learner. Use Clap to react to someone's update.",
  },
  {
    title: "Manage your target and progress",
    body: "The header shows the cohort target date and time remaining. Reset roadmap progress in Profile settings if you want to clear topic statuses and timers; this also removes earned topic points, but keeps projects and resources.",
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
      title="How the tracker works"
      centered
      size="md"
    >
      <Stack gap="md">
        {GUIDE_SECTIONS.map((section) => (
          <section key={section.title}>
            <Text size="sm" fw={700}>
              {section.title}
            </Text>
            <Text size="sm" c="dimmed" mt={3}>
              {section.body}
            </Text>
          </section>
        ))}
      </Stack>
    </Modal>
  );
}
