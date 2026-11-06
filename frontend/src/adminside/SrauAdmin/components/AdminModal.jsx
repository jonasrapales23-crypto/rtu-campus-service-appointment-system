export default function AdminModal({ title, onClose, children }) {
  return <div className="srau-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="srau-modal" role="dialog" aria-modal="true" aria-labelledby="srau-modal-title"><div className="srau-modal-heading"><h2 id="srau-modal-title">{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>{children}</section></div>;
}
