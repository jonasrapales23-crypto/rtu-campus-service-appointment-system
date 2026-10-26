import Navbar from "../navbar/Navbar.jsx";
import { getAppointment } from "../services/appointments.js";
import { downloadTicketImage } from "../utils/ticketImage.js";
import { formatDate, parseDateKey } from "../utils/dates.js";
import "../styles/Login.css";
import "../styles/Srau.css";
import "../styles/Features.css";

const OFFICE_LEGEND = "R = Registrar, H = Health, B = Business Affairs, M = MIS";

export default function Ticket() {
  const id = new URLSearchParams(window.location.search).get("id");
  const appointment = id ? getAppointment(id) : null;

  if (!appointment) {
    return (
      <div className="site-shell">
        <Navbar />

        <main className="srau-main">
          <h1 className="srau-title">Your ticket</h1>
          <p className="srau-message" role="status">
            We could not find that ticket on this device.
          </p>
          <a className="srau-link" href="/appointments">
            Go to My Appointments
          </a>
        </main>
      </div>
    );
  }

  const isPickup = appointment.officeLetter !== "H";

  return (
    <div className="site-shell">
      <Navbar />

      <main className="srau-main">
        <h1 className="srau-title">Your ticket</h1>

        <section className="srau-ticket" aria-label="Appointment ticket">
          <span className="srau-ticket-label">Control number</span>
          <div className="srau-ticket-number">
            {appointment.controlNumber}
          </div>

          <p>
            <strong>{appointment.officeCode}</strong> · Queue{" "}
            {String(appointment.queue).padStart(3, "0")} ·{" "}
            {appointment.service}
            <br />
            {appointment.student.name} · {appointment.student.program}
            <br />
            {isPickup ? "Pickup" : "Appointment"}:{" "}
            {formatDate(parseDateKey(appointment.date))} ·{" "}
            {appointment.time}
            {appointment.receiverName && (
              <>
                {" "}
                · Receiver: {appointment.receiverName} (representative)
              </>
            )}
          </p>

          <p className="srau-fee-note">
            <strong>Fee: {appointment.feeText}</strong>
            {appointment.feeText.startsWith("No") ? "." : " when you pick up."}{" "}
            {appointment.receiverName
              ? "The receiver brings a valid ID."
              : "Bring your valid ID."}
          </p>

          <p className="srau-help">
            Format: Month-Day-Office-Queue-Service-6-digit code (
            {OFFICE_LEGEND})
          </p>

          <button
            className="srau-generate-button"
            type="button"
            onClick={() => downloadTicketImage(appointment)}
          >
            Save as image
          </button>
        </section>

        <a className="srau-link" href="/appointments">
          View my appointments
        </a>
      </main>
    </div>
  );
}
