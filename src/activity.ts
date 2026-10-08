import { supabase } from "./supabase";

export type ActivityEventType =
  | "topic_started"
  | "topic_completed"
  | "project_added"
  | "resource_added";

export interface ActivityEvent {
  id: string;
  user_id: string;
  display_name: string;
  event_type: ActivityEventType;
  topic_id: string | null;
  subject: string;
  entity_id: string | null;
  target_url: string | null;
  created_at: string;
  reaction_count: number;
  reacted_by_me: boolean;
}

function getClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function loadActivity(userId: string): Promise<ActivityEvent[]> {
  const client = getClient();

  const { data, error } = await client
    .from("activity_events")
    .select(
      "id, user_id, display_name, event_type, topic_id, subject, entity_id, target_url, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const events = data ?? [];
  if (events.length === 0) return [];

  const { data: reactions, error: reactionError } = await client
    .from("activity_reactions")
    .select("activity_id, user_id")
    .in(
      "activity_id",
      events.map((event) => event.id),
    );

  if (reactionError) throw reactionError;

  const reactionSummary = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of reactions ?? []) {
    const summary = reactionSummary.get(reaction.activity_id) ?? {
      count: 0,
      mine: false,
    };
    summary.count += 1;
    summary.mine ||= reaction.user_id === userId;
    reactionSummary.set(reaction.activity_id, summary);
  }

  return events.map((event) => {
    const reaction = reactionSummary.get(event.id);
    return {
      ...event,
      reaction_count: reaction?.count ?? 0,
      reacted_by_me: reaction?.mine ?? false,
    } as ActivityEvent;
  });
}

export async function loadUnreadActivityCount(userId: string): Promise<number> {
  const client = getClient();
  const { data: readState, error: readError } = await client
    .from("activity_reads")
    .select("last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw readError;
  if (!readState) return 0;

  const { count, error } = await client
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .gt("created_at", readState.last_seen_at)
    .neq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function markActivityRead(userId: string): Promise<void> {
  const { error } = await getClient()
    .from("activity_reads")
    .upsert(
      { user_id: userId, last_seen_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

export async function toggleActivityReaction(
  activityId: string,
  userId: string,
  reacted: boolean,
): Promise<void> {
  const client = getClient();
  if (reacted) {
    const { error } = await client
      .from("activity_reactions")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await client
    .from("activity_reactions")
    .upsert(
      { activity_id: activityId, user_id: userId },
      { onConflict: "activity_id,user_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}
