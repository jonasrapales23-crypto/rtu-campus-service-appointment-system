import StatusBadge from "./StatusBadge.jsx";

export default function AppointmentTable({ rows, onVerify, onStatus, onMarkReady, reviewOnly = false, hideActions = false }) {
  if (!rows.length) return <div className="srau-empty-state"><b>No appointments found</b><p>Try a different search or filter.</p></div>;
  return <div className="srau-simple-table"><table><thead><tr><th>Control no.</th><th>Student</th><th>Request</th><th>Time</th><th>Status</th>{!hideActions && <th>Actions</th>}</tr></thead><tbody>{rows.map((item) => {
    const status = String(item.status || "").trim().toLowerCase().replace(/\s+/g, " ");
    const isReady = status === "ready for pickup";
    const isProcessing = status === "processing";
    const isWaiting = status === "submitted" || status === "needs processing";
    const isClosed = ["served", "claimed", "no-show", "done", "cancelled", "canceled"].includes(status);
    return <tr key={item.id}><td><span className="srau-table-control">{item.short}</span></td><td><b>{item.student}</b><small className="srau-cell-sub">{item.number} · {item.program}</small></td><td>{item.service}</td><td>{item.time}</td><td><StatusBadge status={item.status} /></td>{!hideActions && <td><div className="srau-table-actions">
      {isProcessing && <button title="Confirm the requested item is ready" onClick={() => onMarkReady(item)}>Mark ready</button>}
      {isReady && <button title="Review ready request" onClick={() => onVerify(item)}>Review</button>}
      {isWaiting && <button title="Begin processing this request" onClick={() => onStatus(item.id, "Processing")}>Start processing</button>}
      {!reviewOnly && !isClosed && !isProcessing && !isReady && !isWaiting && <button onClick={() => onStatus(item.id, "Processing")}>Start processing</button>}
      {!reviewOnly && !isClosed && <button title="Mark no-show" onClick={() => onStatus(item.id, "No-show")}>No-show</button>}
      {isClosed && <span className="srau-help-text">Closed</span>}
    </div></td>}</tr>;
  })}</tbody></table></div>;
}
