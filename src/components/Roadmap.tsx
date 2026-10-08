import { ROADMAP } from "../data/roadmap";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
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
import type { TopicDetail } from "../storage";
import { topicCountdown } from "../progress";
import { loadTopicResourceCounts } from "../resources";
import type { TopicResourceCounts } from "../resources";

const MODULE_ICONS = [
  IconCode,
  IconBook2,
  IconBrain,
  IconSparkles,
  IconRobot,
  IconRefresh,
];

function TopicRow({
  topicId,
  topicTitle,
  topicPoints,
  user,
  detail,
  activeTopicId,
  activeTopicTitle,
  onRequestStart,
  resourceCount,
  onResourceCountChange,
  resourceOpenRequest,
}: {
  topicId: string;
  topicTitle: string;
  topicPoints: number;
  user: User;
  detail: TopicDetail;
  activeTopicId: string | null;
  activeTopicTitle: string;
  onRequestStart: (topicId: string) => void;
  resourceCount: number;
  onResourceCountChange: (topicId: string, delta: number) => void;
  resourceOpenRequest: number;
}) {
  const isActive = topicId === activeTopicId;
  const isBlocked = activeTopicId !== null && !isActive;

  return (
    <div className="roadmap-topic-row">
      <Group gap="xs" wrap="wrap">
        <Text className="roadmap-topic-title" size="sm">
          {topicTitle}
        </Text>
        <Badge color="teal" variant="light" size="sm">
          {topicPoints} pts
        </Badge>
      </Group>
      <Group className="roadmap-topic-controls" gap="xs" wrap="nowrap">
        {detail.status === "complete" ? (
          <>
            <Badge color="teal" variant="light">
              Complete
            </Badge>
            <Button
              size="xs"
              variant="light"
              color="blue"
              disabled={isBlocked}
              title={
                isBlocked ? `Complete ${activeTopicTitle} first` : undefined
              }
              onClick={() => onRequestStart(topicId)}
            >
              Restart
            </Button>
          </>
        ) : isActive ? (
          <Badge color="orange" variant="light">
            In progress
          </Badge>
        ) : (
          <Button
            size="xs"
            variant="light"
            disabled={isBlocked}
            title={isBlocked ? `Complete ${activeTopicTitle} first` : undefined}
            onClick={() => onRequestStart(topicId)}
          >
            Start
          </Button>
        )}
        <TopicResources
          topicId={topicId}
          topicTitle={topicTitle}
          user={user}
          resourceCount={resourceCount}
          onCountChange={onResourceCountChange}
          openRequest={resourceOpenRequest}
        />
      </Group>
    </div>
  );
}

interface Props {
  user: User;
  completedTopics: string[];
  topicDetails: Record<string, TopicDetail>;
  onStart: (topicId: string, durationHours: number) => void;
  onComplete: (topicId: string) => void;
}

export default function Roadmap({
  user,
  completedTopics,
  topicDetails,
  onStart,
  onComplete,
}: Props) {
  const [resourceCounts, setResourceCounts] = useState<TopicResourceCounts>({});
  const pendingCountChanges = useRef<TopicResourceCounts>({});
  const countsLoaded = useRef(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState<number | string>(1);
  const [durationUnit, setDurationUnit] = useState<"hours" | "days">("days");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [resourceOpenRequest, setResourceOpenRequest] = useState({
    topicId: "",
    requestId: 0,
  });

  const activeTopic = ROADMAP.flatMap((module) => module.topics).find(
    (topic) => topicDetails[topic.id]?.status === "in_progress",
  );
  const activeTopicDetail = activeTopic
    ? topicDetails[activeTopic.id]
    : undefined;
  const countdown = activeTopicDetail
    ? topicCountdown(
        activeTopicDetail.startedAt,
        activeTopicDetail.durationHours,
      )
    : null;
  const selectedTopic = ROADMAP.flatMap((module) => module.topics).find(
    (topic) => topic.id === selectedTopicId,
  );
  const selectedTopicIsComplete = selectedTopic
    ? topicDetails[selectedTopic.id]?.status === "complete" ||
      completedTopics.includes(selectedTopic.id)
    : false;

  function requestStart(topicId: string) {
    const savedHours = topicDetails[topicId]?.durationHours ?? 24;
    if (savedHours % 24 === 0) {
      setDurationUnit("days");
      setDurationValue(savedHours / 24);
    } else {
      setDurationUnit("hours");
      setDurationValue(savedHours);
    }
    setSelectedTopicId(topicId);
  }

  function confirmStart() {
    if (!selectedTopicId || activeTopic) return;
    const value = Math.min(
      durationUnit === "days" ? 365 : 8760,
      Math.max(1, Math.round(Number(durationValue) || 1)),
    );
    onStart(selectedTopicId, value * (durationUnit === "days" ? 24 : 1));
    setSelectedTopicId(null);
  }

  function openActiveTopicResources() {
    if (!activeTopic) return;
    setResourceOpenRequest((current) => ({
      topicId: activeTopic.id,
      requestId: current.requestId + 1,
    }));
  }

  function confirmComplete() {
    if (!activeTopic) return;
    onComplete(activeTopic.id);
    setCompletionDialogOpen(false);
  }

  useEffect(() => {
    let active = true;
    loadTopicResourceCounts()
      .then((counts) => {
        for (const [topicId, delta] of Object.entries(
          pendingCountChanges.current,
        )) {
          counts[topicId] = Math.max(0, (counts[topicId] ?? 0) + delta);
        }
        if (active) {
          setResourceCounts(counts);
          countsLoaded.current = true;
        }
      })
      .catch(() => {
        if (active) countsLoaded.current = true;
      });

    return () => {
      active = false;
    };
  }, []);

  function changeResourceCount(topicId: string, delta: number) {
    if (!countsLoaded.current) {
      pendingCountChanges.current[topicId] =
        (pendingCountChanges.current[topicId] ?? 0) + delta;
    }
    setResourceCounts((current) => ({
      ...current,
      [topicId]: Math.max(0, (current[topicId] ?? 0) + delta),
    }));
  }

  return (
    <div className="stack roadmap-stack">
      {activeTopic && (
        <Alert className="topic-active-alert" color="teal" variant="light">
          <div className="topic-active-banner">
            <div className="topic-active-copy">
              <Text className="topic-active-title">One topic at a time</Text>
              <Text size="sm">
                Complete <strong>{activeTopic.title}.</strong>
              </Text>
            </div>
            <div className="topic-active-actions">
              {countdown && (
                <Text
                  className="topic-active-countdown"
                  role="timer"
                  aria-label={
                    countdown.days +
                      countdown.hours +
                      countdown.minutes +
                      countdown.seconds ===
                    0
                      ? "Time up"
                      : `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining`
                  }
                >
                  {countdown.days > 0 && `${countdown.days}d `}
                  {countdown.hours > 0 && `${countdown.hours}h `}
                  {countdown.minutes > 0 && `${countdown.minutes}m `}
                  {countdown.seconds > 0 ? `${countdown.seconds}s` : "Time up"}
                </Text>
              )}
              <Button
                size="sm"
                color="teal"
                onClick={() => setCompletionDialogOpen(true)}
              >
                Mark complete
              </Button>
            </div>
          </div>
        </Alert>
      )}
      <Modal
        opened={completionDialogOpen && activeTopic !== undefined}
        onClose={() => setCompletionDialogOpen(false)}
        title="Great work!"
        centered
        size="sm"
      >
        {activeTopic && (
          <Stack gap="md">
            <Text>
              Nice work studying <strong>{activeTopic.title}</strong>. Share a
              helpful resource with your friends and earn 20 points, or complete
              this topic for {activeTopic.points} points.
            </Text>
            <Button variant="light" onClick={openActiveTopicResources}>
              Add Resource (+20 points)
            </Button>
            <Button color="teal" onClick={confirmComplete}>
              Mark Complete (+{activeTopic.points} points)
            </Button>
          </Stack>
        )}
      </Modal>
      <Modal
        opened={selectedTopic !== undefined}
        onClose={() => setSelectedTopicId(null)}
        title="Set a time limit"
        centered
        size="sm"
      >
        {selectedTopic && (
          <Stack gap="md">
            <Text size="sm">{selectedTopic.title}</Text>
            <SegmentedControl
              fullWidth
              value={durationUnit}
              onChange={(value) => setDurationUnit(value as "hours" | "days")}
              data={[
                { label: "Hours", value: "hours" },
                { label: "Days", value: "days" },
              ]}
            />
            <NumberInput
              label={`How many ${durationUnit} do you need?`}
              value={durationValue}
              onChange={setDurationValue}
              min={1}
              max={durationUnit === "days" ? 365 : 8760}
              step={1}
              suffix={` ${durationUnit}`}
              allowDecimal={false}
              autoFocus
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setSelectedTopicId(null)}
              >
                Cancel
              </Button>
              <Button onClick={confirmStart}>
                {selectedTopicIsComplete ? "Restart topic" : "Start topic"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
      <Accordion
        className="roadmap-accordion"
        multiple
        variant="separated"
        defaultValue={ROADMAP[0] ? [ROADMAP[0].id] : []}
      >
        {ROADMAP.map((mod, i) => {
          const done = mod.topics.filter((t) =>
            completedTopics.includes(t.id),
          ).length;
          const ModuleIcon = MODULE_ICONS[i % MODULE_ICONS.length];
          return (
            <Accordion.Item
              key={mod.id}
              value={mod.id}
              className="roadmap-module"
            >
              <Accordion.Control className="roadmap-module-control">
                <Group justify="space-between" wrap="nowrap" pr="sm">
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
                    {done}/{mod.topics.length}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel className="roadmap-module-panel">
                <ProgressBar
                  percent={Math.round((done / mod.topics.length) * 100)}
                  small
                />
                <Stack gap={0} className="topic-list">
                  {mod.topics.map((t) => {
                    const detail = topicDetails[t.id] ?? {
                      status: completedTopics.includes(t.id)
                        ? "complete"
                        : "not_started",
                      durationHours: 24,
                      startedAt: null,
                    };
                    return (
                      <TopicRow
                        key={t.id}
                        topicId={t.id}
                        topicTitle={t.title}
                        topicPoints={t.points}
                        user={user}
                        detail={detail}
                        activeTopicId={activeTopic?.id ?? null}
                        activeTopicTitle={
                          activeTopic?.title ?? "the active topic"
                        }
                        onRequestStart={requestStart}
                        resourceCount={resourceCounts[t.id] ?? 0}
                        onResourceCountChange={changeResourceCount}
                        resourceOpenRequest={
                          resourceOpenRequest.topicId === t.id
                            ? resourceOpenRequest.requestId
                            : 0
                        }
                      />
                    );
                  })}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
}
