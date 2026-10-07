export type ProjectStatus = "not-started" | "in-progress" | "completed";

export interface UserProgress {
  completedTopics: string[];
  projects: Record<string, ProjectStatus>;
}

const PROGRESS_KEY = "alt.progress";
const SESSION_KEY = "alt.session";

type ProgressStore = Record<string, UserProgress>;

const emptyProgress = (): UserProgress => ({
  completedTopics: [],
  projects: {},
});

function readStore(): ProgressStore {
  try {
    return JSON.parse(
      localStorage.getItem(PROGRESS_KEY) ?? "{}",
    ) as ProgressStore;
  } catch {
    return {};
  }
}

export function loadAllProgress(): ProgressStore {
  return readStore();
}

export function loadProgress(username: string): UserProgress {
  return { ...emptyProgress(), ...readStore()[username] };
}

export function saveProgress(username: string, progress: UserProgress): void {
  const store = readStore();
  store[username] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

export function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function saveSession(username: string | null): void {
  if (username) localStorage.setItem(SESSION_KEY, username);
  else localStorage.removeItem(SESSION_KEY);
}
