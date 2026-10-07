import { supabase } from "./supabase";

export type ResourceType =
  | "video"
  | "document"
  | "article"
  | "course"
  | "other";

export interface TopicResource {
  id: string;
  topic_id: string;
  title: string;
  url: string;
  resource_type: ResourceType;
  description: string | null;
  added_by: string;
  added_by_name: string;
  created_at: string;
}

export interface NewTopicResource {
  topicId: string;
  title: string;
  url: string;
  resourceType: ResourceType;
  description: string;
  userId: string;
  displayName: string;
}

function getClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function loadTopicResources(
  topicId: string,
): Promise<TopicResource[]> {
  const { data, error } = await getClient()
    .from("topic_resources")
    .select(
      "id, topic_id, title, url, resource_type, description, added_by, added_by_name, created_at",
    )
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addTopicResource(
  resource: NewTopicResource,
): Promise<TopicResource> {
  const { data, error } = await getClient()
    .from("topic_resources")
    .insert({
      topic_id: resource.topicId,
      title: resource.title.trim(),
      url: resource.url.trim(),
      resource_type: resource.resourceType,
      description: resource.description.trim() || null,
      added_by: resource.userId,
      added_by_name: resource.displayName.trim(),
    })
    .select(
      "id, topic_id, title, url, resource_type, description, added_by, added_by_name, created_at",
    )
    .single();

  if (error) throw error;
  return data;
}
