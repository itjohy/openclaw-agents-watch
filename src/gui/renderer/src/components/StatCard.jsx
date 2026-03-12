export function StatCard({ label, value, accent, hint }) {
  return (
    <article className={`stat-pill ${accent || ''}`}>
      <span className="stat-pill-label">{label}</span>
      <strong className="stat-pill-value">{value}</strong>
      <span className="stat-pill-hint">{hint}</span>
    </article>
  );
}
