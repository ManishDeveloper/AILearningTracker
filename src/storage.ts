import { completedProjects, topicPercent } from "./progress";
import type { User } from "./data/users";
import { supabase } from "./supabase";

export type ProjectStatus = "not-started" | "in-progress" | "completed";

export interface UserProgress {
  completedTopics: string[];
  projects: Record<string, ProjectStatus>;
}

export const emptyProgress = (): UserProgress => ({
  completedTopics: [],
  projects: {},
});

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  progress_percent: number;
  completed_projects: number;
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
  const { data, error } = await getClient()
    .from("user_progress")
    .select("completed_topics, projects")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  const progress = data
    ? {
        completedTopics: data.completed_topics ?? [],
        projects: (data.projects ?? {}) as Record<string, ProjectStatus>,
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
      projects: progress.projects,
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
        completed_projects: completedProjects(progress),
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
  const { data, error } = await getClient()
    .from("user_leaderboard")
    .select("user_id, display_name, progress_percent, completed_projects");

  if (error) throw error;
  return data ?? [];
}
