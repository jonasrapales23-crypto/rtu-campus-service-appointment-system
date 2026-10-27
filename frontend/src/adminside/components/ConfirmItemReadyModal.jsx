import "./AdminActionModal.css";

export default function ConfirmItemReadyModal({ item, onClose, onConfirm, officeLabel = "" }) {
  if (!item) return null;
  return (
    <div className="admin-action-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-action-modal" role="dialog" aria-modal="true" aria-labelledby="admin-ready-title">
        <div className="admin-action-heading"><h2 id="admin-ready-title">Confirm item is ready</h2><button type="button" className="admin-action-close" aria-label="Close dialog" onClick={onClose}>×</button></div>
        {officeLabel && <p className="admin-action-eyebrow">{officeLabel}</p>}
        <p>Have you prepared the requested item and confirmed that it is available for pickup?</p>
        <div className="admin-action-summary">
          <h3>{item.service}</h3><p>{item.student} {item.number ? `· ${item.number}` : ""}</p>
          <div><span>Control number</span><b>{item.id || item.controlNumber || "—"}</b></div>
          <div><span>Current status</span><b>{item.status || "Processing"}</b></div>
        </div>
        <p className="admin-action-muted">The status will change to Ready for pickup only after you confirm.</p>
        <div className="admin-action-buttons"><button type="button" className="admin-action-button secondary" onClick={onClose}>Not yet</button><button type="button" className="admin-action-button primary" onClick={onConfirm}>Yes, item is ready</button></div>
      </section>
    </div>
  );
}
