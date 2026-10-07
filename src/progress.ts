import { ALL_TOPIC_IDS, PROJECTS, ROADMAP } from "./data/roadmap";
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

export function isModuleComplete(p: UserProgress, moduleId: string): boolean {
  const mod = ROADMAP.find((m) => m.id === moduleId);
  return !!mod && mod.topics.every((t) => p.completedTopics.includes(t.id));
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function getAchievements(p: UserProgress): Achievement[] {
  const topics = p.completedTopics.length;
  const pct = topicPercent(p);
  const statuses = Object.values(p.projects);
  const projectsDone = completedProjects(p);

  return [
    {
      id: "first-topic",
      icon: "🌱",
      title: "First Step",
      description: "Complete your first topic",
      unlocked: topics >= 1,
    },
    {
      id: "five-topics",
      icon: "📚",
      title: "Bookworm",
      description: "Complete 5 topics",
      unlocked: topics >= 5,
    },
    {
      id: "first-module",
      icon: "🧩",
      title: "Module Master",
      description: "Finish an entire module",
      unlocked: ROADMAP.some((m) => isModuleComplete(p, m.id)),
    },
    {
      id: "halfway",
      icon: "⛰️",
      title: "Halfway There",
      description: "Reach 50% of the roadmap",
      unlocked: pct >= 50,
    },
    {
      id: "roadmap-done",
      icon: "🏆",
      title: "Graduate",
      description: "Complete the whole roadmap",
      unlocked: pct === 100,
    },
    {
      id: "first-project-start",
      icon: "🛠️",
      title: "Builder",
      description: "Start your first project",
      unlocked: statuses.some((s) => s !== "not-started"),
    },
    {
      id: "first-project",
      icon: "🚀",
      title: "Shipped It",
      description: "Complete your first project",
      unlocked: projectsDone >= 1,
    },
    {
      id: "all-projects",
      icon: "💎",
      title: "Portfolio Pro",
      description: "Complete all projects",
      unlocked: projectsDone === PROJECTS.length,
    },
  ];
}
