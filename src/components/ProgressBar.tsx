export default function ProgressBar({
  percent,
  small = false,
}: {
  percent: number;
  small?: boolean;
}) {
  return (
    <div
      className={`progress ${small ? "progress-sm" : ""}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
