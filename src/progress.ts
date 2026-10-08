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

export interface TopicCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function topicCountdown(
  startedAt: string | null,
  durationHours: number,
  now = Date.now(),
): TopicCountdown | null {
  if (!startedAt) return null;
  const deadline = Date.parse(startedAt) + durationHours * 60 * 60 * 1000;
  const totalSeconds = Math.max(0, Math.floor((deadline - now) / 1000));

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatTopicDuration(durationHours: number): string {
  return durationHours % 24 === 0
    ? `${durationHours / 24}d`
    : `${durationHours}h`;
}

export function formatTopicTimeRemaining(countdown: TopicCountdown): string {
  if (countdown.days > 0) {
    return countdown.hours > 0
      ? `${countdown.days}d ${countdown.hours}h left`
      : `${countdown.days}d left`;
  }
  if (countdown.hours > 0) {
    return countdown.minutes > 0
      ? `${countdown.hours}h ${countdown.minutes}m left`
      : `${countdown.hours}h left`;
  }
  return countdown.minutes > 0
    ? `${countdown.minutes}m left`
    : `${countdown.seconds}s left`;
}
