import { Progress } from "@mantine/core";

export default function ProgressBar({
  percent,
  small = false,
}: {
  percent: number;
  small?: boolean;
}) {
  return (
    <Progress
      className={`app-progress ${small ? "app-progress-small" : ""}`}
      value={percent}
      size={small ? 6 : 10}
      radius="xl"
      color="teal"
      aria-label="Progress"
    />
  );
}
