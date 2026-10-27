export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="spinner" />
      <p className="muted">Loading YuTara…</p>
    </div>
  );
}
