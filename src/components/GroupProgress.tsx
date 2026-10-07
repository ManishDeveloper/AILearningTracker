import { PROJECTS } from "../data/roadmap";
import { useEffect, useState } from "react";
import { getErrorMessage, loadLeaderboard } from "../storage";
import type { LeaderboardEntry } from "../storage";
import ProgressBar from "./ProgressBar";

export default function GroupProgress({
  currentUser,
}: {
  currentUser: string;
}) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadLeaderboard()
      .then((entries) => {
        if (active) {
          setRows(
            entries.sort(
              (a, b) =>
                b.progress_percent - a.progress_percent ||
                b.completed_projects - a.completed_projects,
            ),
          );
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getErrorMessage(loadError, "Unable to load the group leaderboard."),
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="card">
      {error ? (
        <p className="error">Unable to load group progress: {error}</p>
      ) : rows.length === 0 ? (
        <p className="muted">No group progress yet.</p>
      ) : (
        <ul className="group-list">
          {rows.map((row, i) => (
            <li
              key={row.user_id}
              className={row.user_id === currentUser ? "me" : ""}
            >
              <div className="group-row">
                <span className="rank">#{i + 1}</span>
                <strong className="group-name">
                  {row.display_name}
                  {row.user_id === currentUser && (
                    <span className="muted"> (you)</span>
                  )}
                </strong>
                <span className="muted group-stats">
                  🚀 {row.completed_projects}/{PROJECTS.length} · 🏅{" "}
                  {row.achievements_unlocked}
                </span>
                <span className="group-pct">{row.progress_percent}%</span>
              </div>
              <ProgressBar percent={row.progress_percent} small />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
