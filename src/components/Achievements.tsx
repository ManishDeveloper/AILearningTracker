import { getAchievements } from "../progress";
import type { UserProgress } from "../storage";

export default function Achievements({ progress }: { progress: UserProgress }) {
  const achievements = getAchievements(progress);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <p className="muted">
        {unlocked} of {achievements.length} unlocked
      </p>
      <div className="grid">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`card achievement ${a.unlocked ? "" : "locked"}`}
          >
            <span className="achievement-icon">
              {a.unlocked ? a.icon : "🔒"}
            </span>
            <div>
              <strong>{a.title}</strong>
              <p className="muted">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
