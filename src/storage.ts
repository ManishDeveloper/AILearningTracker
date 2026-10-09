import { completedTopicCount, topicPercent } from "./progress";
import { ALL_TOPIC_IDS } from "./data/roadmap";
import type { User } from "./data/users";
import { supabase } from "./supabase";

export interface UserProgress {
  completedTopics: string[];
  topicDetails: Record<string, TopicDetail>;
}

export type TopicStatus = "not_started" | "in_progress" | "complete";

export interface TopicDetail {
  status: TopicStatus;
  durationHours: number;
  startedAt: string | null;
}

export const emptyProgress = (): UserProgress => ({
  completedTopics: [],
  topicDetails: {},
});

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  progress_percent: number;
  points_total: number;
  completed_topics: number;
  projects_count: number;
  resources_count: number;
}

function getClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

export async function loadProgress(user: User): Promise<UserProgress> {
  return loadUserProgress(user.id);
}

export async function loadUserProgress(userId: string): Promise<UserProgress> {
  const { data, error } = await getClient()
    .from("user_progress")
    .select("completed_topics, topic_details")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const completedTopics: string[] = data?.completed_topics ?? [];
  const topicDetails: Record<string, TopicDetail> = {};

  for (const [topicId, storedDetail] of Object.entries(
    data?.topic_details ?? {},
  )) {
    if (!ALL_TOPIC_IDS.includes(topicId)) continue;
    const legacyDetail = storedDetail as TopicDetail & {
      durationDays?: number;
    };
    topicDetails[topicId] = {
      status: legacyDetail.status,
      durationHours:
        legacyDetail.durationHours ?? (legacyDetail.durationDays ?? 1) * 24,
      startedAt: legacyDetail.startedAt ?? null,
    };
  }

  for (const topicId of completedTopics) {
    if (!ALL_TOPIC_IDS.includes(topicId)) continue;
    topicDetails[topicId] = {
      status: "complete",
      durationHours: topicDetails[topicId]?.durationHours ?? 24,
      startedAt: null,
    };
  }

  const activeTopics = Object.entries(topicDetails)
    .filter(([, detail]) => detail.status === "in_progress")
    .sort(
      ([, a], [, b]) =>
        (Date.parse(a.startedAt ?? "") || 0) -
        (Date.parse(b.startedAt ?? "") || 0),
    );
  for (const [topicId, detail] of activeTopics.slice(1)) {
    topicDetails[topicId] = {
      ...detail,
      status: "not_started",
      startedAt: null,
    };
  }

  const progress = { completedTopics, topicDetails };

  return progress;
}

export async function saveProgress(
  user: User,
  progress: UserProgress,
): Promise<string | null> {
  const client = getClient();
  const { error: progressError } = await client.from("user_progress").upsert(
    {
      user_id: user.id,
      completed_topics: progress.completedTopics,
      topic_details: progress.topicDetails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (progressError) throw progressError;

  const { error: leaderboardError } = await client
    .from("user_leaderboard")
    .upsert(
      {
        user_id: user.id,
        display_name: user.displayName,
        progress_percent: topicPercent(progress),
        completed_topics: completedTopicCount(progress),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (leaderboardError) {
    return `Progress saved, but the leaderboard could not be updated: ${leaderboardError.message}`;
  }
  return null;
}

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const client = getClient();
  const [leaderboardResult, pointsResult, projectsResult, resourcesResult] =
    await Promise.all([
      client
        .from("user_leaderboard")
        .select("user_id, display_name, progress_percent, completed_topics"),
      client.from("user_points").select("user_id, display_name, points_total"),
      client.from("user_projects").select("user_id"),
      client.from("topic_resources").select("added_by"),
    ]);

  if (leaderboardResult.error) throw leaderboardResult.error;
  if (pointsResult.error) throw pointsResult.error;
  if (projectsResult.error) throw projectsResult.error;
  if (resourcesResult.error) throw resourcesResult.error;

  const progressByUser = new Map(
    (leaderboardResult.data ?? []).map((entry) => [entry.user_id, entry]),
  );
  const projectCounts = new Map<string, number>();
  for (const project of projectsResult.data ?? []) {
    projectCounts.set(
      project.user_id,
      (projectCounts.get(project.user_id) ?? 0) + 1,
    );
  }
  const resourceCounts = new Map<string, number>();
  for (const resource of resourcesResult.data ?? []) {
    resourceCounts.set(
      resource.added_by,
      (resourceCounts.get(resource.added_by) ?? 0) + 1,
    );
  }

  return (pointsResult.data ?? []).map((score) => ({
    user_id: score.user_id,
    display_name:
      progressByUser.get(score.user_id)?.display_name ?? score.display_name,
    progress_percent: progressByUser.get(score.user_id)?.progress_percent ?? 0,
    points_total: score.points_total,
    completed_topics: progressByUser.get(score.user_id)?.completed_topics ?? 0,
    projects_count: projectCounts.get(score.user_id) ?? 0,
    resources_count: resourceCounts.get(score.user_id) ?? 0,
  }));
}
