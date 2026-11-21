import { useState, useEffect } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Modal from "../components/Modal.jsx";
import RescheduleModal from "../components/appointments/RescheduleModal.jsx";
import {
  STATUS_STEPS,
  cancelAppointment,
  isUpcoming,
  listAppointments,
} from "../services/appointments.js";
import { getOfficeConfig } from "../data/officeBookings.js";
import { formatDate, parseDateKey } from "../utils/dates.js";
import "../styles/Login.css";
import "../styles/Srau.css";
import "../styles/Features.css";

function Tracker({ status }) {
  const current = STATUS_STEPS.indexOf(status);

  return (
    <p className="appt-tracker" aria-label={`Status: ${status}`}>
      {STATUS_STEPS.map((step, index) => {
        const symbol =
          index < current ? "✓" : index === current ? "●" : "○";

        return (
          <span key={step}>
            {index > 0 && " → "}
            {symbol} {step}
          </span>
        );
      })}
    </p>
  );
}

export default function MyAppointments() {
  const [tab, setTab] = useState(
    new URLSearchParams(window.location.search).get("tab") === "history"
      ? "history"
      : "upcoming"
  );
  
  const [appointments, setAppointments] = useState([]);
  const [cancelling, setCancelling] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  // frontend/src/pages/MyAppointments.jsx
  
  // Refetch mechanism connecting live to MySQL rows
  function refresh() {
    listAppointments().then((data) => {
      if (data && Array.isArray(data)) {
        setAppointments(data);
      }
    });
  }

  useEffect(() => {
    refresh();
    
    // Adjusted background poll loop to prevent rapid race condition overrides
    const syncInterval = setInterval(refresh, 8000);
    return () => clearInterval(syncInterval);
  }, []);

  // Strict local mapping to ensure status updates stick visually on the student side
  const upcoming = appointments.filter((item) => {
    const status = String(item?.status || "").trim().toLowerCase();
    return status === "submitted" || status === "processing" || status === "ready for pickup" || status === "waiting";
  });

  const history = appointments.filter((item) => {
    const status = String(item?.status || "").trim().toLowerCase();
    return status === "claimed" || status === "completed" || status === "no-show" || status === "cancelled" || status === "served";
  });

  const shown = tab === "upcoming" ? upcoming : history;

  function confirmCancel() {
    if (!cancelling) return;
    cancelAppointment(cancelling.id).then(() => {
      setCancelling(null);
      refresh();
    });
  }

  const reminder = upcoming.length > 0 && (
    <>
      <h2 className="appt-heading">Reminder</h2>
      <p className="srau-fee-note">
        Bring: valid ID. Pay any due processing fees at the cashier counter lines (HSU medical clinic services need no payment).
      </p>
    </>
  );

  return (
    <div className="site-shell">
      <Navbar activePage="appointments" />

      <main className="srau-main">
        <h1 className="srau-title">My appointments</h1>

        <div className="appt-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upcoming"}
            className={tab === "upcoming" ? "selected" : ""}
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            className={tab === "history" ? "selected" : ""}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>

        {shown.length === 0 && (
          <p className="srau-fee-note">
            {tab === "upcoming"
              ? "You have no upcoming appointments. Pick an office on the home page to book one."
              : "No past appointments yet."}
          </p>
        )}

        {shown.map((item) => {
          const canChange =
            item.status === "Submitted" || item.status === "Processing";
          
          // 🟢 IMMERSIVE VISUAL BADGE CLASSES
          const badge =
            item.status === "Claimed" || item.status === "Completed" || item.status === "Served"
              ? "ok"
              : item.status === "Cancelled" || item.status === "No-show"
                ? "bad"
                : "info";

          // Render clean UI presentation elements fallback pointers strings
          const displayStatus = item.status === "Claimed" ? "Claimed / Served" : item.status;

          return (
            <article className="appt-card" key={item.id}>
              <div className="appt-main">
                <strong>{item.student?.name || "Student Visitor"}</strong>
                <span>{item.controlNumber}</span>
                <span>
                  {item.service} · {item.officeCode} ·{" "}
                  {item.officeLetter === "H" ? "Appointment" : "Pickup"}{" "}
                  {formatDate(parseDateKey(item.date))}, {item.time}
                </span>

                {tab === "upcoming" && <Tracker status={item.status} />}

                <div className="appt-actions">
                  <a href={`/ticket?id=${encodeURIComponent(item.id)}`}>
                    View ticket
                  </a>

                  {canChange && (
                    <>
                      <button
                        type="button"
                        className="appt-reschedule"
                        onClick={() => setRescheduling(item)}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="appt-cancel"
                        onClick={() => setCancelling(item)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <span className={`appt-badge ${badge}`}>{displayStatus}</span>
            </article>
          );
        })}

        {tab === "upcoming" && reminder}
      </main>

      {cancelling && (
        <Modal
          title="Cancel this appointment?"
          onClose={() => setCancelling(null)}
          actions={
            <>
              <button
                className="srau-generate-button srau-danger-button"
                type="button"
                onClick={confirmCancel}
              >
                Yes, cancel
              </button>
              <button
                className="srau-secondary-button"
                type="button"
                onClick={() => setCancelling(null)}
              >
                Keep it
              </button>
            </>
          }
        >
          <p>
            {cancelling.service} · {cancelling.officeCode}
            <br />
            {cancelling.controlNumber}
          </p>
        </Modal>
      )}

      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          config={getOfficeConfig(rescheduling.officeCode)}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}