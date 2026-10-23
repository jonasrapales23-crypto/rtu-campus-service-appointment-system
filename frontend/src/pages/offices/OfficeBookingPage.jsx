import { useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import ServicePicker from "../../components/forms/ServicePicker.jsx";
import UploadBox from "../../components/forms/UploadBox.jsx";
import Calendar from "../../components/scheduling/Calendar.jsx";
import TimeSlots from "../../components/scheduling/TimeSlots.jsx";
import usePickupSchedule from "../../hooks/usePickupSchedule.js";
import { formatDate } from "../../utils/dates.js";
import "../../styles/Login.css";
import "../../styles/Srau.css";
import "../../styles/OfficeBooking.css";

export default function OfficeBookingPage({ config }) {
  const [service, setService] = useState(config.services[0]);
  const [validId, setValidId] = useState(null);
  const [message, setMessage] = useState("");
  const schedule = usePickupSchedule({
    processingDays: config.processingDays ?? 0,
    defaultTime: "",
    onChange: () => setMessage(""),
  });

  function handleContinue() {
    setMessage("");
    if (config.mode === "walkin") {
      setMessage(`Selected: ${service}. Please proceed to the MISU service window and follow the queue.`);
      return;
    }
    if (config.mode === "pickup" && !validId) {
      setMessage("Please upload your valid ID before continuing.");
      return;
    }
    if (!schedule.selectedDate || !schedule.selectedTime) {
      setMessage(`Please select an ${config.mode === "appointment" ? "appointment" : "pickup"} date and time.`);
      return;
    }
    setMessage("Your selections are ready. Final booking will be available when the backend is connected.");
  }

  const isWalkIn = config.mode === "walkin";
  const isAppointment = config.mode === "appointment";
  const actionLabel = isWalkIn ? "View visit instructions" : isAppointment ? "Request appointment" : "Generate ticket";

  return (
    <div className="site-shell">
      <Navbar />
      <main className="office-booking-main">
        <div className="office-page-heading">
          <span className="office-code-pill">{config.code}</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>

        <ServicePicker
          services={config.services}
          value={service}
          onChange={(nextService) => { setService(nextService); setMessage(""); }}
          processingDays={config.processingDays ?? 0}
          note={config.serviceNote}
        />

        {isWalkIn ? (
          <section className="office-info-panel" aria-label="MISU walk-in information">
            <h2>How to get service</h2>
            <ol>
              <li>Bring your student ID and any information relevant to your request.</li>
              <li>Visit the MISU service window during office hours.</li>
              <li>Wait to be served in order of arrival.</li>
            </ol>
            <p>{config.note}</p>
          </section>
        ) : (
          <>
            {config.mode === "pickup" && (
              <section className="srau-section">
                <h2>2 · Upload requirements</h2>
                <div className="srau-upload-grid">
                  <UploadBox
                    title="Valid ID"
                    note="Required for verification"
                    file={validId}
                    onChange={(event) => { setValidId(event.target.files?.[0] || null); setMessage(""); }}
                  />
                  <div className="office-requirement-note">
                    <strong>Additional requirements</strong>
                    <span>Check with BAU for any product-specific documents before your visit.</span>
                  </div>
                </div>
                <p className="srau-help">Accepted files: PDF, JPG, JPEG, or PNG.</p>
              </section>
            )}

            <section className="srau-section">
              <h2>{config.mode === "appointment" ? "2 · Pick an appointment date and time" : "3 · Pick a pickup date and time"}</h2>
              <p className="srau-earliest">
                {isAppointment ? "Earliest appointment" : "Earliest pickup"}: {formatDate(schedule.earliestPickup)}.
              </p>
              <div className="srau-schedule">
                <Calendar schedule={schedule} />
                <TimeSlots schedule={schedule} timeSlots={config.timeSlots} />
              </div>
            </section>
          </>
        )}

        <p className="office-note">{config.note}</p>
        {message && <p className="srau-message" role="status">{message}</p>}
        <button className="srau-generate-button" type="button" onClick={handleContinue}>{actionLabel}</button>
      </main>
    </div>
  );
}
