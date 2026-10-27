import { useEffect, useState } from "react";
import "./AdminActionModal.css";

const defaultFields = (item) => [
  { label: "Name", value: item.student },
  { label: "Student number", value: item.number },
  { label: "Program", value: item.program },
  { label: "Dates of attendance", value: item.attendanceDates || "2023–2027" },
];

export default function VerifyAtCounterModal({ item, fields, onClose, onComplete, officeLabel = "", allowNoShow = true }) {
  const [checked, setChecked] = useState([]);
  const verificationFields = fields || (item ? defaultFields(item) : []);
  useEffect(() => { setChecked([]); }, [item?.id]);
  if (!item) return null;
  const allChecked = verificationFields.length > 0 && verificationFields.every((field) => checked.includes(field.label));
  return (
    <div className="admin-action-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-action-modal" role="dialog" aria-modal="true" aria-labelledby="admin-verify-title">
        <div className="admin-action-heading"><h2 id="admin-verify-title">Verify at the counter</h2><button type="button" className="admin-action-close" aria-label="Close dialog" onClick={onClose}>×</button></div>
        {officeLabel && <p className="admin-action-eyebrow">{officeLabel}</p>}
        <p className="admin-action-person"><b>{item.student}</b> · {item.service}</p>
        <p className="admin-action-muted">Confirm these details with the receiver. A control number does not replace identity verification.</p>
        <div className="admin-action-fields">{verificationFields.map((field) => <label className="admin-action-check" key={field.label}><input type="checkbox" checked={checked.includes(field.label)} onChange={(event) => setChecked((old) => event.target.checked ? [...old, field.label] : old.filter((label) => label !== field.label))}/><span><b>{field.label}</b><small>{field.value || "Not provided"}</small></span></label>)}</div>
        <div className="admin-action-buttons">{allowNoShow && <button type="button" className="admin-action-button danger" onClick={() => onComplete("No-show")}>No-show</button>}<button type="button" className="admin-action-button secondary" onClick={onClose}>Cancel</button><button type="button" className="admin-action-button primary" disabled={!allChecked} onClick={() => onComplete("Served")}>Mark served</button></div>
      </section>
    </div>
  );
}
