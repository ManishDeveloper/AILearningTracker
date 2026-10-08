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

export interface TopicResourceChanges {
  title: string;
  url: string;
  resourceType: ResourceType;
  description: string;
}

export type TopicResourceCounts = Record<string, number>;

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

export async function loadTopicResourceCounts(): Promise<TopicResourceCounts> {
  const { data, error } = await getClient()
    .from("topic_resources")
    .select("topic_id");

  if (error) throw error;

  return (data ?? []).reduce<TopicResourceCounts>((counts, resource) => {
    counts[resource.topic_id] = (counts[resource.topic_id] ?? 0) + 1;
    return counts;
  }, {});
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

export async function updateTopicResource(
  resourceId: string,
  changes: TopicResourceChanges,
): Promise<TopicResource> {
  const { data, error } = await getClient()
    .from("topic_resources")
    .update({
      title: changes.title.trim(),
      url: changes.url.trim(),
      resource_type: changes.resourceType,
      description: changes.description.trim() || null,
    })
    .eq("id", resourceId)
    .select(
      "id, topic_id, title, url, resource_type, description, added_by, added_by_name, created_at",
    )
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "No resource was updated. Make sure you are signed in as its author and run the latest supabase-topic-resources.sql migration to enable owner-only updates.",
    );
  }
  return data;
}

export async function deleteTopicResource(resourceId: string): Promise<void> {
  const { data, error } = await getClient()
    .from("topic_resources")
    .delete()
    .eq("id", resourceId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("You can only remove resources you added.");
}
