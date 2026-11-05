import { useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "../styles/Login.css";
import "../styles/hsu.css";
import "../styles/misu.css";

const services = [
  {
    id: "receipt",
    title: "Receipt",
    description: "Request a first-time receipt or reprint an existing receipt.",
    icon: "🧾",
  },
  {
    id: "grade-slip",
    title: "Grade Slip",
    description: "Request your student grade slip.",
    icon: "📄",
  },
  {
    id: "regiform",
    title: "Registration Form",
    description: "Request a copy of your registration form.",
    icon: "📋",
  },
  {
    id: "id",
    title: "Student ID",
    description: "Request a new student ID or a replacement.",
    icon: "🪪",
  },
];

// Same time-slot generation as HSU.
const timeSlots = [];

for (let minutes = 8 * 60; minutes <= 16 * 60 + 55; minutes += 5) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  timeSlots.push(
    `${displayHour}:${String(minute).padStart(2, "0")} ${period}`
  );
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Same calendar design and behavior as HSU.
function Calendar({ selectedDate, onSelectDate }) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function changeMonth(amount) {
    setVisibleMonth(new Date(year, month + amount, 1));
  }

  return (
    <div className="hsu-calendar">
      <div className="hsu-calendar-header">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={
            year === today.getFullYear() &&
            month === today.getMonth()
          }
          aria-label="Previous month"
        >
          ‹
        </button>

        <h3>
          {visibleMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="hsu-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="hsu-calendar-days">
        {days.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} />;
          }

          const date = new Date(year, month, day);
          const disabled = date < today;
          const selected =
            getDateKey(date) === getDateKey(selectedDate);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              className={selected ? "selected" : ""}
              onClick={() => onSelectDate(date)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Misu() {
  const [step, setStep] = useState("services");
  const [selectedService, setSelectedService] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [selectedTime, setSelectedTime] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    studentNumber: "",
    requestType: "first-time",
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [ticketNumber, setTicketNumber] = useState("");

  const selectedDateLabel = useMemo(
    () => formatDate(selectedDate),
    [selectedDate]
  );

  const needsUpload =
    (selectedService?.id === "receipt" &&
      form.requestType === "reprint") ||
    (selectedService?.id === "id" &&
      form.requestType === "replacement");

  const uploadTitle =
    selectedService?.id === "receipt"
      ? "Upload a copy/photo of your old receipt"
      : "Upload your Affidavit of Loss";

  function chooseService(service) {
    setSelectedService(service);
    setSelectedTime("");
    setUploadedFile(null);

    setForm({
      fullName: "",
      studentNumber: "",
      requestType: "first-time",
    });

    setStep("booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear the uploaded file when changing request type.
    if (name === "requestType") {
      setUploadedFile(null);
    }
  }

  function confirmAppointment(event) {
    event.preventDefault();

    if (!form.fullName.trim() || !form.studentNumber.trim()) {
      alert("Please enter your name and student number.");
      return;
    }

    if (needsUpload && !uploadedFile) {
      alert("Please upload the required document.");
      return;
    }

    if (!selectedTime) {
      alert("Please select an appointment time.");
      return;
    }

    const randomNumber = Math.floor(
      100000 + Math.random() * 900000
    );

    setTicketNumber(`MISU-${randomNumber}`);
    setStep("ticket");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startOver() {
    setStep("services");
    setSelectedService(null);
    setSelectedTime("");
    setUploadedFile(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);

    setTicketNumber("");

    setForm({
      fullName: "",
      studentNumber: "",
      requestType: "first-time",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="hsu-main misu-main">

        {/* PAGE HEADING */}
        {step !== "ticket" && (
          <header className="hsu-page-heading">
            <p className="hsu-eyebrow">RTU CAMPUS SERVICES</p>
            <h1>
              Management Information Systems Unit (MISU)
            </h1>
            <p>
              Request your receipts, grade slips, registration
              forms, and student ID services.
            </p>
          </header>
        )}

        {/* SERVICE SELECTION */}
        {step === "services" && (
          <>
            <div className="hsu-step-heading">
              <button
                type="button"
                className="hsu-back-button"
                onClick={() => window.history.back()}
                aria-label="Go back"
              >
                ‹
              </button>

              <h2>Select a service</h2>
            </div>

            <section className="hsu-panel">
              <div className="hsu-panel-heading">
                <h2>Available Services</h2>
                <p>Choose the service you need to continue.</p>
              </div>

              {services.map((service) => (
                <button
                  type="button"
                  className="hsu-service-option"
                  key={service.id}
                  onClick={() => chooseService(service)}
                >
                  <span className="hsu-service-icon">
                    {service.icon}
                  </span>

                  <span className="hsu-service-copy">
                    <strong>{service.title}</strong>
                    <small>{service.description}</small>
                  </span>

                  <span className="hsu-service-arrow">›</span>
                </button>
              ))}
            </section>
          </>
        )}

        {/* BOOKING DETAILS AND SCHEDULE */}
        {step === "booking" && selectedService && (
          <>
            <div className="hsu-step-heading">
              <button
                type="button"
                className="hsu-back-button"
                onClick={() => setStep("services")}
                aria-label="Back to services"
              >
                ‹
              </button>

              <h2>Complete your request</h2>
            </div>

            <form
              className="hsu-booking-form"
              onSubmit={confirmAppointment}
            >
              {/* STUDENT DETAILS */}
              <section className="hsu-panel hsu-details-form">
                <div className="hsu-panel-heading">
                  <h2>1 · Your details</h2>
                  <p>
                    Please provide your name and student number.
                  </p>
                </div>

                <div className="hsu-form-grid">
                  <label className="hsu-form-field">
                    <span>Full Name *</span>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={updateForm}
                      placeholder="Enter your full name"
                      required
                    />
                  </label>

                  <label className="hsu-form-field">
                    <span>Student Number *</span>
                    <input
                      name="studentNumber"
                      value={form.studentNumber}
                      onChange={updateForm}
                      placeholder="Enter your student number"
                      required
                    />
                  </label>
                </div>

                {/* RECEIPT REQUEST TYPE */}
                {selectedService.id === "receipt" && (
                  <div className="misu-extra-field">
                    <label htmlFor="receiptType">
                      Receipt Request Type *
                    </label>

                    <select
                      id="receiptType"
                      name="requestType"
                      value={form.requestType}
                      onChange={updateForm}
                      required
                    >
                      <option value="first-time">
                        First-time Receipt
                      </option>
                      <option value="reprint">
                        Receipt Reprint
                      </option>
                    </select>

                    {form.requestType === "reprint" && (
                      <p className="misu-requirement-note">
                        Please upload a copy or photo of your
                        previous receipt.
                      </p>
                    )}
                  </div>
                )}

                {/* ID REQUEST TYPE */}
                {selectedService.id === "id" && (
                  <div className="misu-extra-field">
                    <label htmlFor="idType">
                      ID Request Type *
                    </label>

                    <select
                      id="idType"
                      name="requestType"
                      value={form.requestType}
                      onChange={updateForm}
                      required
                    >
                      <option value="first-time">
                        First-time ID
                      </option>
                      <option value="replacement">
                        Replacement ID
                      </option>
                    </select>

                    {form.requestType === "replacement" && (
                      <p className="misu-requirement-note">
                        An Affidavit of Loss is required for
                        replacement IDs.
                      </p>
                    )}
                  </div>
                )}

                {/* CONDITIONAL FILE UPLOAD */}
                {needsUpload && (
                  <div className="misu-upload-field">
                    <label htmlFor="misuDocument">
                      {uploadTitle} *
                    </label>

                    <input
                      id="misuDocument"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) =>
                        setUploadedFile(
                          event.target.files?.[0] || null
                        )
                      }
                      required
                    />

                    <small>
                      Accepted formats: PDF, JPG, JPEG, and PNG.
                    </small>

                    {uploadedFile && (
                      <p className="misu-file-name">
                        Selected file: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* DATE AND TIME */}
              <section className="hsu-panel hsu-schedule-panel">
                <div className="hsu-panel-heading">
                  <h2>2 · Pick a date and time</h2>
                  <p>{selectedService.title}</p>
                  <p>
                    Select an available appointment date and time.
                  </p>
                </div>

                <div className="hsu-schedule-content">
                  <div className="hsu-calendar-column">
  <Calendar
    selectedDate={selectedDate}
    onSelectDate={(date) => {
      setSelectedDate(date);
      setSelectedTime("");
    }}
  />
</div>

                  <div className="hsu-time-column">
                    <h3>{selectedDateLabel}</h3>

                    <div className="hsu-time-grid">
                      {timeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          className={
                            selectedTime === time ? "selected" : ""
                          }
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>

                    {!selectedTime && (
                      <p className="hsu-selection-hint">
                        Please select an appointment time.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="hsu-booking-submit">
                <button
                  type="submit"
                  className="hsu-primary-button"
                >
                  Generate Ticket
                </button>
              </div>
            </form>
          </>
        )}

        {/* GENERATED TICKET */}
        {step === "ticket" && selectedService && (
          <section className="hsu-ticket-page">
            <h1>Your ticket</h1>

            <div className="hsu-ticket-card">
              <p className="hsu-ticket-label">Control number</p>
              <h2>{ticketNumber}</h2>

              <div className="hsu-ticket-details">
                <p><strong>MANAGEMENT INFORMATION SYSTEMS UNIT</strong></p>
                <p>{selectedService.title}</p>
                <p>
                  Request type:{" "}
                  {form.requestType === "reprint"
                    ? "Receipt Reprint"
                    : form.requestType === "replacement"
                    ? "Replacement ID"
                    : "First-time Request"}
                </p>
                <p>{form.fullName}</p>
                <p>{form.studentNumber}</p>
                <p>
                  {formatDate(selectedDate)} · {selectedTime}
                </p>
                {uploadedFile && (
                  <p>Uploaded document: {uploadedFile.name}</p>
                )}
              </div>

              <div className="hsu-ticket-note">
                Please bring the necessary supporting documents
                when claiming your request.
              </div>

              <p className="hsu-ticket-format">
                Please keep a copy of your appointment ticket.
              </p>

              <div className="hsu-ticket-actions">
                <button
                  type="button"
                  className="hsu-primary-button"
                  onClick={() => window.print()}
                >
                  Save / Print Ticket
                </button>

                <button
                  type="button"
                  className="hsu-secondary-button"
                  onClick={startOver}
                >
                  Back to MISU
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
