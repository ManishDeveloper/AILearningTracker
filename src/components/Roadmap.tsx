import { ROADMAP, type RoadmapItemType } from "../data/roadmap.ts";
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
  TextInput,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBook2,
  IconBrain,
  IconCode,
  IconPlayerPlay,
  IconCheck,
  IconRefresh,
  IconRobot,
  IconRocket,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react";
import ProgressBar from "./ProgressBar";
import TopicResources from "./TopicResources";
import type { User } from "../data/users";
import type { TopicDetail } from "../storage";
import { getErrorMessage } from "../storage";
import { topicCountdown } from "../progress";
import { loadTopicResourceCounts } from "../resources";
import type { TopicResourceCounts } from "../resources";
import {
  addUserProject,
  loadUserProjects,
  updateUserProject,
} from "../projects";
import type { ProjectInput, UserProject } from "../projects";
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
  topicType,
  stepNumber,
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
  topicType: RoadmapItemType;
  stepNumber: number;
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
    <div className={`roadmap-topic-row${isActive ? " is-active" : ""}`}>
      <div
        className={`roadmap-step-marker${
          topicType === "project" ? " is-project" : ""
        }${detail.status === "complete" ? " is-complete" : ""}`}
        aria-hidden="true"
      >
        {detail.status === "complete" ? (
          <IconCheck size={15} stroke={2.5} />
        ) : topicType === "project" ? (
          <IconRocket size={15} stroke={2} />
        ) : (
          String(stepNumber).padStart(2, "0")
        )}
      </div>
      <div className="roadmap-topic-content">
        <Group className="roadmap-topic-heading" gap="xs" wrap="wrap">
          <Text className="roadmap-topic-title" size="sm">
            {topicTitle}
          </Text>
          {topicType === "project" && (
            <Badge color="orange" variant="light" size="sm">
              Project
            </Badge>
          )}
          <Group
            className="roadmap-topic-points"
            gap={4}
            wrap="nowrap"
            aria-label={`${topicPoints} points`}
          >
            <IconTrophy size={16} stroke={2.5} aria-hidden="true" />
            <Text size="xs" fw={700}>
              {topicPoints} pts
            </Text>
          </Group>
        </Group>
      </div>
      <Group className="roadmap-topic-controls" gap="xs" wrap="nowrap">
        {detail.status === "complete" ? (
          <>
            <Badge color="teal" variant="light">
              Complete
            </Badge>
            {topicType !== "project" && (
              <Button
                className="roadmap-restart-button"
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconRefresh size={14} />}
                disabled={isBlocked}
                title={
                  isBlocked ? `Complete ${activeTopicTitle} first` : undefined
                }
                onClick={() => onRequestStart(topicId)}
              >
                Restart
              </Button>
            )}
          </>
        ) : isActive ? (
          <Badge color="orange" variant="light">
            In progress
          </Badge>
        ) : (
          <Button
            className="roadmap-start-button"
            size="xs"
            variant="filled"
            color="teal"
            leftSection={<IconPlayerPlay size={14} />}
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
  const [userProjects, setUserProjects] = useState<UserProject[] | null>(null);
  const [projectLoadFailed, setProjectLoadFailed] = useState(false);
  const pendingCountChanges = useRef<TopicResourceCounts>({});
  const countsLoaded = useRef(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState<number | string>(1);
  const [durationUnit, setDurationUnit] = useState<"hours" | "days">("days");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [projectGithubUrl, setProjectGithubUrl] = useState("");
  const [projectLiveUrl, setProjectLiveUrl] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const completionInFlight = useRef(false);
  const [resourceOpenRequest, setResourceOpenRequest] = useState({
    topicId: "",
    requestId: 0,
  });

  const activeTopic = ROADMAP.flatMap((module) => module.topics).find(
    (topic) => topicDetails[topic.id]?.status === "in_progress",
  );
  const activeTopicModule = ROADMAP.find((module) =>
    module.topics.some((topic) => topic.id === activeTopic?.id),
  );
  const existingRoadmapProject = activeTopic
    ? userProjects?.find(
        (project) => project.roadmap_item_id === activeTopic.id,
      )
    : undefined;
  const hasRoadmapProject = Boolean(existingRoadmapProject);
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

  function openCompletionDialog() {
    setCompletionError("");
    if (activeTopic?.type === "project") {
      const existingProject = userProjects?.find(
        (project) => project.roadmap_item_id === activeTopic.id,
      );
      setProjectGithubUrl(existingProject?.github_url ?? "");
      setProjectLiveUrl(existingProject?.live_url ?? "");
      setProjectDescription(existingProject?.description ?? "");
    }
    setCompletionDialogOpen(true);
  }

  async function confirmComplete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTopic || completionInFlight.current) return;
    if (
      activeTopic.type === "project" &&
      (userProjects === null || projectLoadFailed || !activeTopicModule)
    ) {
      return;
    }

    completionInFlight.current = true;
    setCompleting(true);
    setCompletionError("");
    try {
      if (activeTopic.type === "project") {
        if (!projectGithubUrl.trim()) {
          setCompletionError(
            "Add a GitHub link before completing this project.",
          );
          return;
        }

        let normalizedGithubUrl: string;
        let normalizedLiveUrl: string | null;
        try {
          const githubUrl = new URL(projectGithubUrl.trim());
          if (
            githubUrl.protocol !== "http:" &&
            githubUrl.protocol !== "https:"
          ) {
            throw new Error();
          }
          normalizedGithubUrl = githubUrl.toString();

          if (projectLiveUrl.trim()) {
            const liveUrl = new URL(projectLiveUrl.trim());
            if (liveUrl.protocol !== "http:" && liveUrl.protocol !== "https:") {
              throw new Error();
            }
            normalizedLiveUrl = liveUrl.toString();
          } else {
            normalizedLiveUrl = null;
          }
        } catch {
          setCompletionError("Enter valid http:// or https:// project links.");
          return;
        }

        const projectInput: ProjectInput = {
          moduleId: activeTopicModule!.id,
          roadmapItemId: activeTopic.id,
          title: activeTopic.title,
          liveUrl: normalizedLiveUrl ?? "",
          githubUrl: normalizedGithubUrl,
          description: projectDescription,
          userId: user.id,
          displayName: user.displayName,
        };
        const project = existingRoadmapProject
          ? await updateUserProject(existingRoadmapProject.id, projectInput)
          : await addUserProject(projectInput);
        setUserProjects((current) => {
          if (!current) return [project];
          if (existingRoadmapProject) {
            return current.map((item) =>
              item.id === project.id ? project : item,
            );
          }
          return [project, ...current];
        });
      }
      onComplete(activeTopic.id);
      setCompletionDialogOpen(false);
    } catch (error: unknown) {
      setCompletionError(
        getErrorMessage(error, "Unable to save this roadmap project."),
      );
    } finally {
      completionInFlight.current = false;
      setCompleting(false);
    }
  }

  useEffect(() => {
    let active = true;
    setUserProjects(null);
    setProjectLoadFailed(false);

    loadUserProjects(user.id)
      .then((projects) => {
        if (active) setUserProjects(projects);
      })
      .catch(() => {
        if (active) {
          setUserProjects([]);
          setProjectLoadFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [user.id]);

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
              <Group gap="xs" wrap="wrap">
                <Badge
                  color={activeTopic.type === "project" ? "orange" : "gray"}
                  variant="light"
                  size="sm"
                >
                  {activeTopic.type === "project" ? "Project" : "Topic"}
                </Badge>
                <Text className="topic-active-title">
                  One learning item at a time
                </Text>
              </Group>
              <Group gap="xs" wrap="wrap">
                <Text size="sm">
                  Complete <strong>{activeTopic.title}.</strong>
                </Text>
              </Group>
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
              <Button size="sm" color="teal" onClick={openCompletionDialog}>
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
          <form
            onSubmit={(event) => void confirmComplete(event)}
            noValidate={false}
          >
            <Stack gap="md">
              <Text>
                {activeTopic.type === "project"
                  ? "Nice work on"
                  : "Nice work studying"}{" "}
                <strong>{activeTopic.title}</strong>. Share a helpful resource
                with your friends and earn 50 points, or complete this item for{" "}
                {activeTopic.points} points.
              </Text>
              <Button
                type="button"
                variant="light"
                onClick={openActiveTopicResources}
              >
                Add Resource (+50 points)
              </Button>
              {activeTopic.type === "project" && (
                <>
                  <Alert
                    color={
                      projectLoadFailed
                        ? "red"
                        : hasRoadmapProject
                          ? "teal"
                          : "orange"
                    }
                    variant="light"
                  >
                    {userProjects === null
                      ? "Checking for a project linked to this roadmap item..."
                      : projectLoadFailed
                        ? "Couldn't check your Projects list. Try again later."
                        : hasRoadmapProject
                          ? "Update or confirm the project links below. This entry will remain in your Projects list."
                          : "Add the project links below. It will be saved to Projects when you mark this item complete."}
                  </Alert>
                  <TextInput
                    label="GitHub link"
                    placeholder="https://github.com/you/project"
                    type="url"
                    value={projectGithubUrl}
                    onChange={(event) =>
                      setProjectGithubUrl(event.currentTarget.value)
                    }
                    required
                    disabled={completing}
                  />
                  <TextInput
                    label="Live project link (optional)"
                    placeholder="https://your-project.example"
                    type="url"
                    value={projectLiveUrl}
                    onChange={(event) =>
                      setProjectLiveUrl(event.currentTarget.value)
                    }
                    disabled={completing}
                  />
                  <Textarea
                    label="Description (optional)"
                    placeholder="What does your project do?"
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(event.currentTarget.value)
                    }
                    maxLength={1000}
                    autosize
                    minRows={2}
                    maxRows={5}
                    disabled={completing}
                  />
                  {completionError && (
                    <Alert color="red" variant="light">
                      {completionError}
                    </Alert>
                  )}
                </>
              )}
              <Button
                color="teal"
                type="submit"
                loading={completing}
                disabled={
                  completing ||
                  (activeTopic.type === "project" &&
                    (userProjects === null || projectLoadFailed))
                }
              >
                Mark Complete (+{activeTopic.points} points)
              </Button>
            </Stack>
          </form>
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
                {selectedTopic.type === "project"
                  ? "Start Project"
                  : selectedTopicIsComplete
                    ? "Restart Topic"
                    : "Start Topic"}
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
                  {mod.topics.map((t, topicIndex) => {
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
                        topicType={t.type}
                        stepNumber={topicIndex + 1}
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
