
import { useMemo, useState } from "react";
import Navbar from "../../navbar/Navbar.jsx";
import "../../styles/Login.css";
import "../../styles/hsu.css";
import "../../styles/Srau.css";
import {
  FileText,
  Award,
  Stamp,
  ScrollText,
} from "lucide-react";

const services = [
  {
    id: "tor",
    title: "Transcript of Records",
    description: "Request an official copy of your academic records.",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "Request school-related certificates.",
  },
  {
    id: "ctc",
    title: "CTC / Authentication",
    description: "Request certified true copies or authentication.",
  },
  {
    id: "diploma",
    title: "Diploma",
    description: "Request a copy or replacement of your diploma.",
  },
];

const timeSlots = [
  { time: "8:00 AM", left: 12 },
  { time: "9:00 AM", left: 9 },
  { time: "9:30 AM", left: 6 },
  { time: "10:00 AM", left: 0 },
  { time: "10:30 AM", left: 4 },
  { time: "1:00 PM", left: 11 },
  { time: "1:30 PM", left: 8 },
];

function addWorkingDays(date, count) {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  let added = 0;

  while (added < count) {
    result.setDate(result.getDate() + 1);

    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }

  return result;
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

function UploadBox({ title, note, file, onChange }) {
  return (
    <label className="srau-upload-box">
      <span className="srau-upload-symbol" aria-hidden="true">
        ↑
      </span>

      <strong>{title}</strong>

      {file ? (
        <span className="upload-file-name">{file.name}</span>
      ) : (
        <span className="upload-note">{note}</span>
      )}

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onChange}
      />

      <span className="upload-action">
        {file ? "Change file" : "Choose file"}
      </span>
    </label>
  );
}

function Calendar({ selectedDate, onSelectDate, earliestPickup }) {
  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        earliestPickup.getFullYear(),
        earliestPickup.getMonth(),
        1
      )
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const minimumMonth = new Date(
    earliestPickup.getFullYear(),
    earliestPickup.getMonth(),
    1
  );

  function changeMonth(amount) {
    setVisibleMonth((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1
      );

      return next < minimumMonth ? minimumMonth : next;
    });
  }

  return (
    <div className="hsu-calendar">
      <div className="hsu-calendar-header">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={visibleMonth.getTime() <= minimumMonth.getTime()}
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
          date.setHours(0, 0, 0, 0);

          const disabled = date < earliestPickup;
          const selected = getDateKey(date) === getDateKey(selectedDate);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              className={selected ? "selected" : ""}
              onClick={() => onSelectDate(date)}
              aria-pressed={selected}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Srau() {
  const [step, setStep] = useState("services");
  const [service, setService] = useState(services[0]);
  const [torLevel, setTorLevel] = useState("College");

  const [validId, setValidId] = useState(null);
  const [requiredDocument, setRequiredDocument] = useState(null);

  const [claimant, setClaimant] = useState("");
  const [authorizationLetter, setAuthorizationLetter] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return addWorkingDays(today, 5);
  });

  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [ticketNumber, setTicketNumber] = useState("");
  const [message, setMessage] = useState("");

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const earliestPickup = useMemo(
    () => addWorkingDays(today, 5),
    [today]
  );

  const selectedDateLabel = formatDate(selectedDate);

  const fee = service.id === "tor"
    ? torLevel === "College"
      ? 380
      : torLevel === "Master's"
        ? 530
        : 780
    : service.id === "ctc"
      ? 150
      : service.id === "certificates"
        ? 150
        : 500;

  function chooseService(item) {
    setService(item);
    setStep("booking");
    setMessage("");
    setSelectedTime("9:00 AM");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateFile(setter, event) {
    setter(event.target.files?.[0] || null);
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!validId || !requiredDocument) {
      setMessage("Please upload your valid ID and required document.");
      return;
    }

    if (!claimant) {
      setMessage("Please select who will claim the document.");
      return;
    }

    if (claimant === "someone-else") {
      if (!authorizationLetter || !receiverId || !receiverName.trim()) {
        setMessage(
          "Please complete the receiver details and upload the authorization letter and receiver's ID."
        );
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      setMessage("Please select a pickup date and time.");
      return;
    }

    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    setTicketNumber(`SRAU-${randomNumber}`);
    setStep("ticket");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startOver() {
    setStep("services");
    setService(services[0]);
    setTorLevel("College");

    setValidId(null);
    setRequiredDocument(null);

    setClaimant("");
    setAuthorizationLetter(null);
    setReceiverId(null);
    setReceiverName("");

    setSelectedDate(earliestPickup);
    setSelectedTime("9:00 AM");
    setTicketNumber("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="hsu-main srau-main">
        {step !== "ticket" && (
          <header className="hsu-page-heading">
            <p className="hsu-eyebrow">RTU CAMPUS SERVICES</p>
            <h1>University Registrar's Office (SRAU)</h1>
            <p>
              Request your academic documents and schedule your pickup
              through the University Registrar's Office.
            </p>
          </header>
        )}

        {step === "services" && (
          <>
            <div className="hsu-step-heading">
              <button
                type="button"
                className="hsu-back-button"
                onClick={() => window.history.back()}
              >
                ‹
              </button>
              <h2>Select a service</h2>
            </div>

            <section className="hsu-panel">
              <div className="hsu-panel-heading">
                <h2>Available Services</h2>
                <p>Choose the document or service you need.</p>
              </div>

              <div className="srau-service-list">
                {services.map((item) => (
                  <button
                    type="button"
                    className="hsu-service-option"
                    key={item.id}
                    onClick={() => chooseService(item)}
                  >
                    <span
  className="hsu-service-icon srau-service-icon"
  aria-hidden="true"
>
  {item.id === "tor" ? (
    <FileText size={20} strokeWidth={1.8} />
  ) : item.id === "certificates" ? (
    <Award size={20} strokeWidth={1.8} />
  ) : item.id === "ctc" ? (
    <Stamp size={20} strokeWidth={1.8} />
  ) : (
    <ScrollText size={20} strokeWidth={1.8} />
  )}
</span>

                    <span className="hsu-service-copy">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>

                    <span className="hsu-service-arrow">›</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {step === "booking" && (
          <>
            <div className="hsu-step-heading">
              <button
                type="button"
                className="hsu-back-button"
                onClick={() => setStep("services")}
              >
                ‹
              </button>
              <h2>Complete your document request</h2>
            </div>

            <form className="hsu-booking-form" onSubmit={handleSubmit}>
              <section className="hsu-panel">
                <div className="hsu-panel-heading">
                  <h2>1 · Selected service</h2>
                  <p>{service.title}</p>
                </div>

                {service.id === "tor" && (
                  <label className="hsu-form-field">
                    <span>Academic Level *</span>
                    <select
                      className="srau-level-select"
                      value={torLevel}
                      onChange={(event) => setTorLevel(event.target.value)}
                    >
                      <option value="College">College</option>
                      <option value="Master's">Master's</option>
                      <option value="Doctor's">Doctor's</option>
                    </select>
                  </label>
                )}

                <div className="srau-fee-note">
                  <strong>Fee:</strong>{" "}
                  {service.id === "tor"
                    ? `₱${fee - 30} + ₱30 document stamp = ₱${fee}`
                    : `₱${fee}`}
                  {" · "}
                  <strong>Processing:</strong> 5 working days
                </div>
              </section>

              <section className="hsu-panel">
                <div className="hsu-panel-heading">
                  <h2>2 · Upload requirements</h2>
                  <p>
                    Upload clear copies of the required documents.
                    Accepted files: PDF, JPG, JPEG, and PNG.
                  </p>
                </div>

                <div className="srau-upload-grid">
                  <UploadBox
                    title="Valid ID *"
                    note="Upload a copy of your valid ID"
                    file={validId}
                    onChange={(event) => updateFile(setValidId, event)}
                  />

                  <UploadBox
                    title="Required document *"
                    note="Upload the document required by the office"
                    file={requiredDocument}
                    onChange={(event) =>
                      updateFile(setRequiredDocument, event)
                    }
                  />
                </div>
              </section>

              <section className="hsu-panel">
                <div className="hsu-panel-heading">
                  <h2>3 · Who will claim the document?</h2>
                  <p>Select who will personally pick up the requested document.</p>
                </div>

                <label className="hsu-form-field">
                  <span>Claimant *</span>
                  <select
                    className="srau-level-select"
                    value={claimant}
                    onChange={(event) => {
                      setClaimant(event.target.value);
                      setMessage("");
                    }}
                    required
                  >
                    <option value="">Select who will claim the document</option>
                    <option value="me">I will claim it myself</option>
                    <option value="someone-else">Someone else will claim it</option>
                  </select>
                </label>

                {claimant === "someone-else" && (
                  <div className="srau-claimant-extra">
                    <div className="srau-upload-grid">
                      <UploadBox
                        title="Authorization letter *"
                        note="Upload the signed authorization letter"
                        file={authorizationLetter}
                        onChange={(event) =>
                          updateFile(setAuthorizationLetter, event)
                        }
                      />

                      <UploadBox
                        title="Receiver's valid ID *"
                        note="Upload the receiver's valid ID"
                        file={receiverId}
                        onChange={(event) => updateFile(setReceiverId, event)}
                      />
                    </div>

                    <label className="hsu-form-field">
                      <span>Full name of the receiver *</span>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(event) => setReceiverName(event.target.value)}
                        placeholder="Enter receiver's full name"
                        required
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="hsu-panel hsu-schedule-panel">
                <div className="hsu-panel-heading">
                  <h2>4 · Pick a pickup date and time</h2>
                  <p>
                    {service.title} · ₱{fee}
                  </p>
                  <p>
                    Earliest pickup: {formatDate(earliestPickup)}.
                    Your document needs five working days of processing.
                  </p>
                </div>

                <div className="hsu-booking-form-schedule">
                  <div>
                    <Calendar
                      selectedDate={selectedDate}
                      earliestPickup={earliestPickup}
                      onSelectDate={(date) => {
                        setSelectedDate(date);
                        setMessage("");
                      }}
                    />
                  </div>

                  <div className="hsu-time-column">
                    <h3>{selectedDateLabel}</h3>

                    <div className="hsu-time-grid">
                      {timeSlots.map((slot) => {
                        const unavailable = slot.left === 0;

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={unavailable}
                            className={
                              selectedTime === slot.time ? "selected" : ""
                            }
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setMessage("");
                            }}
                          >
                            {slot.time}
                            {unavailable ? " · Full" : ` · ${slot.left} left`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {message && (
                <p className="srau-message" role="alert">
                  {message}
                </p>
              )}

              <div className="hsu-booking-submit">
                <button type="submit" className="hsu-primary-button">
                  Generate Ticket
                </button>
              </div>
            </form>
          </>
        )}

        {step === "ticket" && (
          <section className="hsu-ticket-page">
            <h1>Your pickup ticket</h1>

            <div className="hsu-ticket-card">
              <p className="hsu-ticket-label">Control number</p>
              <h2>{ticketNumber}</h2>

              <div className="hsu-ticket-details">
                <p><strong>UNIVERSITY REGISTRAR'S OFFICE (SRAU)</strong></p>
                <p>{service.title}</p>
                {service.id === "tor" && <p>{torLevel} Level</p>}
                <p>Claimant: {claimant === "me" ? "Self" : receiverName}</p>
                <p>{selectedDateLabel} · {selectedTime}</p>
              </div>

              <div className="srau-ticket-files">
                <p><strong>Uploaded requirements</strong></p>
                <p>Valid ID: {validId?.name}</p>
                <p>Required document: {requiredDocument?.name}</p>
                {claimant === "someone-else" && (
                  <>
                    <p>Authorization letter: {authorizationLetter?.name}</p>
                    <p>Receiver's ID: {receiverId?.name}</p>
                  </>
                )}
              </div>

              <div className="hsu-ticket-note">
                Document fee: <strong>₱{fee}</strong>
              </div>

              <p className="hsu-ticket-format">
                Please keep a copy of your ticket and bring your original
                identification documents when claiming your request.
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
                  Back to SRAU
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
