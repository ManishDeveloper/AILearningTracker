import { supabase } from "./supabase";

export interface UserProject {
  id: string;
  user_id: string;
  display_name: string;
  module_id: string;
  title: string;
  live_url: string | null;
  github_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  moduleId: string;
  title: string;
  liveUrl: string;
  githubUrl: string;
  description: string;
  userId: string;
  displayName: string;
}

const PROJECT_COLUMNS =
  "id, user_id, display_name, module_id, title, live_url, github_url, description, created_at, updated_at";

function getClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function projectValues(project: ProjectInput) {
  return {
    module_id: project.moduleId,
    title: project.title.trim(),
    live_url: project.liveUrl.trim() || null,
    github_url: project.githubUrl.trim() || null,
    description: project.description.trim() || null,
    display_name: project.displayName.trim(),
  };
}

export async function loadUserProjects(userId: string): Promise<UserProject[]> {
  const { data, error } = await getClient()
    .from("user_projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addUserProject(
  project: ProjectInput,
): Promise<UserProject> {
  const { data, error } = await getClient()
    .from("user_projects")
    .insert({
      ...projectValues(project),
      user_id: project.userId,
    })
    .select(PROJECT_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProject(
  projectId: string,
  project: ProjectInput,
): Promise<UserProject> {
  const { data, error } = await getClient()
    .from("user_projects")
    .update({ ...projectValues(project), updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .select(PROJECT_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "No project was updated. Make sure you are signed in as its owner and run the latest supabase-user-projects.sql migration.",
    );
  }
  return data;
}

export async function deleteUserProject(projectId: string): Promise<void> {
  const { data, error } = await getClient()
    .from("user_projects")
    .delete()
    .eq("id", projectId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("You can only remove projects you own.");
}
