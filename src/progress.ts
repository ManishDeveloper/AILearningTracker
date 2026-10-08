import { ALL_TOPIC_IDS } from "./data/roadmap";
import type { UserProgress } from "./storage";

export function topicPercent(p: UserProgress): number {
  const done = completedTopicCount(p);
  return Math.round((done / ALL_TOPIC_IDS.length) * 100);
}

export function completedTopicCount(p: UserProgress): number {
  return new Set(p.completedTopics.filter((id) => ALL_TOPIC_IDS.includes(id)))
    .size;
}
