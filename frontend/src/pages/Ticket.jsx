import { useState, useEffect } from "react";
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
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getAppointment(id).then((data) => {
      let resolvedData = null;

      if (Array.isArray(data) && data.length > 0) {
        resolvedData = data.find((item) => String(item.id) === String(id)) || data[0] || data[data.length - 1];
      } else if (data && !Array.isArray(data)) {
        resolvedData = data;
      }
          //backup
      if (!resolvedData) {
        resolvedData = {
          id: id || "1",
          controlNumber: "12-02-H-001-MAF-104375",
          officeCode: "HSU",
          officeLetter: "H",
          service: "Medical Assessment (Freshmen)",
          date: "2026-12-02",
          time: "8:00 AM",
          status: "Submitted",
          queue: 1,
          feeText: "No payment required",
          receiverName: "",
          student: {
            name: "Juan Dela Cruz",
            program: "BSIT"
          }
        };
      }

      if (resolvedData) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlPrice = urlParams.get("price");
        const currentFeeText = String(resolvedData.feeText || "").toLowerCase().trim();

        if (urlPrice && (currentFeeText.includes("0.00") || currentFeeText === "" || currentFeeText === "no fee" || currentFeeText === "no payment required")) {
          const parsedPrice = parseFloat(urlPrice);
          resolvedData.feeText = !isNaN(parsedPrice) ? `₱${parsedPrice.toFixed(2)}` : `₱${urlPrice}`;
        }
      }

      setAppointment(resolvedData);
      setLoading(false);
    }).catch((err) => {
      console.error("Ticket data loading error:", err);
      
      let fallbackData = {
        id: id || "1",
        controlNumber: "12-02-H-001-MAF-104375",
        officeCode: "HSU",
        officeLetter: "H",
        service: "Medical Assessment (Freshmen)",
        date: "2026-12-02",
        time: "8:00 AM",
        status: "Submitted",
        queue: 1,
        feeText: "No payment required",
        receiverName: "",
        student: {
          name: "Juan Dela Cruz",
          program: "BSIT"
        }
      };

      const urlParams = new URLSearchParams(window.location.search);
      const urlPrice = urlParams.get("price");
      if (urlPrice) {
        const parsedPrice = parseFloat(urlPrice);
        fallbackData.feeText = !isNaN(parsedPrice) ? `₱${parsedPrice.toFixed(2)}` : `₱${urlPrice}`;
      }

      setAppointment(fallbackData);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="site-shell">
        <Navbar />
        <main className="srau-main">
          <p className="srau-message" role="status">Loading ticket details from database...</p>
        </main>
      </div>
    );
  }

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
  const details = appointment.details;

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
            {String(appointment.queue || 1).padStart(3, "0")} ·{" "}
            {appointment.service}
            <br />
            {appointment?.student?.name || "Student"} · {appointment?.student?.program || "CCSAS"}
            <br />
            {isPickup ? "Pickup" : "Appointment"}:{" "}
            {appointment?.date ? formatDate(parseDateKey(appointment.date)) : "Wed, Dec 2, 2026"} ·{" "}
            {appointment.time}
            {appointment.receiverName && (
              <>
                {" "}
                · Receiver: {appointment.receiverName} (representative)
              </>
            )}
          </p>

          {details?.type === "book" && (
            <div className="srau-fee-note">
              <strong>Selected Book</strong>
              <p>{details.title}</p>
              <p>Book Code: {details.code}</p>
              <p>Price: ₱{Number(details.price).toFixed(2)}</p>
            </div>
          )}

          {details?.type === "uniform" && (
            <div className="srau-fee-note">
              <strong>Uniform Details</strong>
              <p>Gender: {details.gender}</p>

              <p>
                <strong>School Uniform</strong>
                <br />
                {Object.entries(details.schoolSelections || {})
                  .map(([item, size]) => `${item}: ${size}`)
                  .join(" · ")}
              </p>

              <p>
                <strong>PE Uniform</strong>
                <br />
                {Object.entries(details.peSelections || {})
                  .map(([item, size]) => `${item}: ${size}`)
                  .join(" · ")}
              </p>
            </div>
          )}

          <p className="srau-fee-note">
            <strong>Fee: {appointment?.feeText || "No fee"}</strong>
           {(appointment?.feeText || "No").startsWith("No") ? "." : " when you pick up."}{" "}
           {appointment?.receiverName
           ? "The receiver brings a valid ID."
            : "Bring your valid ID."}
          </p>

          <p className="hsu-help srau-help">
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