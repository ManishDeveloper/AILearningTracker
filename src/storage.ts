import { completedTopicCount, topicPercent } from "./progress";
import type { User } from "./data/users";
import { supabase } from "./supabase";

export interface UserProgress {
  completedTopics: string[];
}

export const emptyProgress = (): UserProgress => ({
  completedTopics: [],
});

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  progress_percent: number;
  points_total: number;
  completed_topics: number;
  projects_count: number;
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
    .select("completed_topics")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const progress = data
    ? {
        completedTopics: data.completed_topics ?? [],
      }
    : emptyProgress();

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
  const [leaderboardResult, pointsResult, projectsResult] = await Promise.all([
    client
      .from("user_leaderboard")
      .select("user_id, display_name, progress_percent, completed_topics"),
    client.from("user_points").select("user_id, display_name, points_total"),
    client.from("user_projects").select("user_id"),
  ]);

  if (leaderboardResult.error) throw leaderboardResult.error;
  if (pointsResult.error) throw pointsResult.error;
  if (projectsResult.error) throw projectsResult.error;

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

  return (pointsResult.data ?? []).map((score) => ({
    user_id: score.user_id,
    display_name:
      progressByUser.get(score.user_id)?.display_name ?? score.display_name,
    progress_percent: progressByUser.get(score.user_id)?.progress_percent ?? 0,
    points_total: score.points_total,
    completed_topics: progressByUser.get(score.user_id)?.completed_topics ?? 0,
    projects_count: projectCounts.get(score.user_id) ?? 0,
  }));
}
