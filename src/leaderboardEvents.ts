export const LEADERBOARD_UPDATED_EVENT = "ai-learning-leaderboard-updated";

export function notifyLeaderboardUpdated(): void {
  window.dispatchEvent(new Event(LEADERBOARD_UPDATED_EVENT));
}
