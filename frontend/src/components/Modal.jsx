import { useEffect } from "react";

// Small centered dialog with a dimmed backdrop. Closes on Escape.
export default function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="srau-modal-overlay" onClick={onClose}>
      <div
        className="srau-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        <div className="srau-modal-body">{children}</div>
        <div className="srau-modal-actions">{actions}</div>
      </div>
    </div>
  );
}
