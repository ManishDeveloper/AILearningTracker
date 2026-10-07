import { PROJECTS } from "../data/roadmap";
import type { ProjectStatus } from "../storage";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

interface Props {
  statuses: Record<string, ProjectStatus>;
  onChange: (projectId: string, status: ProjectStatus) => void;
}

export default function Projects({ statuses, onChange }: Props) {
  return (
    <div className="grid">
      {PROJECTS.map((p) => {
        const status = statuses[p.id] ?? "not-started";
        return (
          <article key={p.id} className="card project">
            <div className="module-head">
              <h3>{p.title}</h3>
              <span className={`badge badge-${status}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="muted">{p.description}</p>
            <select
              value={status}
              onChange={(e) => onChange(p.id, e.target.value as ProjectStatus)}
              aria-label={`Status for ${p.title}`}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </article>
        );
      })}
    </div>
  );
}
