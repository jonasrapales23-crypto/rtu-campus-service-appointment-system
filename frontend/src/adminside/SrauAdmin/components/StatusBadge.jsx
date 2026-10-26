export default function StatusBadge({ status }) {
  const kind = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`srau-status srau-status-${kind}`}>{status}</span>;
}
