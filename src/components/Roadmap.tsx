import { ROADMAP } from "../data/roadmap";
import ProgressBar from "./ProgressBar";

interface Props {
  completedTopics: string[];
  onToggle: (topicId: string) => void;
}

export default function Roadmap({ completedTopics, onToggle }: Props) {
  return (
    <div className="stack">
      {ROADMAP.map((mod, i) => {
        const done = mod.topics.filter((t) =>
          completedTopics.includes(t.id),
        ).length;
        const pct = Math.round((done / mod.topics.length) * 100);
        return (
          <section key={mod.id} className="card">
            <div className="module-head">
              <h3>
                {i + 1}. {mod.title}
              </h3>
              <span className="muted">
                {done}/{mod.topics.length}
              </span>
            </div>
            <ProgressBar percent={pct} small />
            <ul className="topic-list">
              {mod.topics.map((t) => {
                const checked = completedTopics.includes(t.id);
                return (
                  <li key={t.id}>
                    <label className={`topic ${checked ? "done" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(t.id)}
                      />
                      <span>{t.title}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
