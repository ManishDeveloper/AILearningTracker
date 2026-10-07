import { useState } from "react";
import type { User } from "../data/users";
import { ALL_TOPIC_IDS, PROJECTS } from "../data/roadmap";
import { completedProjects, getAchievements, topicPercent } from "../progress";
import { loadProgress, saveProgress } from "../storage";
import type { ProjectStatus, UserProgress } from "../storage";
import ProgressBar from "./ProgressBar";
import Roadmap from "./Roadmap";
import Projects from "./Projects";
import Achievements from "./Achievements";
import GroupProgress from "./GroupProgress";

const TABS = ["Roadmap", "Projects", "Achievements", "Group"] as const;
type Tab = (typeof TABS)[number];

export default function Dashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [progress, setProgress] = useState<UserProgress>(() =>
    loadProgress(user.username),
  );
  const [tab, setTab] = useState<Tab>("Roadmap");

  function update(next: UserProgress) {
    setProgress(next);
    saveProgress(user.username, next);
  }

  function toggleTopic(topicId: string) {
    const done = progress.completedTopics.includes(topicId);
    update({
      ...progress,
      completedTopics: done
        ? progress.completedTopics.filter((id) => id !== topicId)
        : [...progress.completedTopics, topicId],
    });
  }

  function setProjectStatus(projectId: string, status: ProjectStatus) {
    update({
      ...progress,
      projects: { ...progress.projects, [projectId]: status },
    });
  }

  const percent = topicPercent(progress);
  const badges = getAchievements(progress).filter((a) => a.unlocked).length;

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🤖 AI Learning Tracker</span>
        <div className="topbar-right">
          <span>Hi, {user.displayName}</span>
          <button className="btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="container">
        <section className="card summary">
          <div className="module-head">
            <h2>Overall progress</h2>
            <span className="big-pct">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
          <div className="stats">
            <span>
              📘 {progress.completedTopics.length}/{ALL_TOPIC_IDS.length} topics
            </span>
            <span>
              🚀 {completedProjects(progress)}/{PROJECTS.length} projects
            </span>
            <span>🏅 {badges} achievements</span>
          </div>
        </section>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={t === tab ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "Roadmap" && (
          <Roadmap
            completedTopics={progress.completedTopics}
            onToggle={toggleTopic}
          />
        )}
        {tab === "Projects" && (
          <Projects statuses={progress.projects} onChange={setProjectStatus} />
        )}
        {tab === "Achievements" && <Achievements progress={progress} />}
        {tab === "Group" && <GroupProgress currentUser={user.username} />}
      </main>
    </div>
  );
}
