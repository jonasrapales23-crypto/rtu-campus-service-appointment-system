// Step "Choose a service" with the fee / processing note.
export default function ServicePicker({
  services,
  value,
  onChange,
  processingDays,
  note,
}) {
  return (
    <section className="srau-section">
      <h2>1 · Choose a service</h2>

      <div className="srau-service-grid">
        {services.map((item) => (
          <button
            key={item}
            type="button"
            className={`srau-service-option ${
              value === item ? "selected" : ""
            }`}
            onClick={() => onChange(item)}
            aria-pressed={value === item}
          >
            {item}
          </button>
        ))}
      </div>

      {note ? (
        <div className="srau-fee-note">{note}</div>
      ) : (
        <div className="srau-fee-note">
          <strong>Fee:</strong> ₱ — (paid at the counter) ·{" "}
          <strong>Processing:</strong> {processingDays} working days. The
          office prepares your document before you arrive.
        </div>
      )}
    </section>
  );
}
