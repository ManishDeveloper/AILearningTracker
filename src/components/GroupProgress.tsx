import { USERS } from "../data/users";
import { PROJECTS } from "../data/roadmap";
import { completedProjects, getAchievements, topicPercent } from "../progress";
import { loadProgress } from "../storage";
import ProgressBar from "./ProgressBar";

export default function GroupProgress({
  currentUser,
}: {
  currentUser: string;
}) {
  const rows = USERS.map((u) => {
    const p = loadProgress(u.username);
    return {
      user: u,
      percent: topicPercent(p),
      projects: completedProjects(p),
      badges: getAchievements(p).filter((a) => a.unlocked).length,
    };
  }).sort((a, b) => b.percent - a.percent || b.projects - a.projects);

  return (
    <div className="card">
      <ul className="group-list">
        {rows.map((r, i) => (
          <li
            key={r.user.username}
            className={r.user.username === currentUser ? "me" : ""}
          >
            <div className="group-row">
              <span className="rank">#{i + 1}</span>
              <strong className="group-name">
                {r.user.displayName}
                {r.user.username === currentUser && (
                  <span className="muted"> (you)</span>
                )}
              </strong>
              <span className="muted group-stats">
                🚀 {r.projects}/{PROJECTS.length} · 🏅 {r.badges}
              </span>
              <span className="group-pct">{r.percent}%</span>
            </div>
            <ProgressBar percent={r.percent} small />
          </li>
        ))}
      </ul>
    </div>
  );
}
