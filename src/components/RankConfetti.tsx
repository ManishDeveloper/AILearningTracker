const COLORS = ["#13a982", "#efb53d", "#e8795a", "#58a978"];

export default function RankConfetti() {
  return (
    <span className="rank-confetti" aria-hidden="true">
      {Array.from({ length: 32 }, (_, piece) => (
        <span
          className="rank-confetti-piece"
          key={piece}
          style={{
            left: `${3 + (piece * 94) / 31}%`,
            top: `${(piece % 3) * 3}px`,
            backgroundColor: COLORS[piece % COLORS.length],
            animationDelay: `${(piece % 10) * 70}ms`,
          }}
        />
      ))}
    </span>
  );
}
