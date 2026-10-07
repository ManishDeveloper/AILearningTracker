import { ALL_TOPIC_IDS, PROJECTS } from "./data/roadmap";
import type { UserProgress } from "./storage";

export function topicPercent(p: UserProgress): number {
  const done = p.completedTopics.filter((id) =>
    ALL_TOPIC_IDS.includes(id),
  ).length;
  return Math.round((done / ALL_TOPIC_IDS.length) * 100);
}

export function completedProjects(p: UserProgress): number {
  return PROJECTS.filter((pr) => p.projects[pr.id] === "completed").length;
}
