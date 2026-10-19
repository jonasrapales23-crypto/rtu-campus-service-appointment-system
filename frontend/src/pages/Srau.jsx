import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "../styles/Login.css";
import "../styles/Srau.css";

const services = [
  "Transcript of Records",
  "Certificates",
  "CTC / Authentication",
  "Diploma",
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

    const day = result.getDay();

    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return result;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function UploadBox({ title, note, file, onChange }) {
  return (
    <label className="srau-upload-box">
      <span className="upload-icon" aria-hidden="true">
        📄 ↑
      </span>

      <span>{title}</span>

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

export default function Srau() {
  const [service, setService] = useState("Transcript of Records");
  const [validId, setValidId] = useState(null);
  const [requiredDocument, setRequiredDocument] = useState(null);
  const [claimant, setClaimant] = useState("");
  const [authorizationLetter, setAuthorizationLetter] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [message, setMessage] = useState("");

  // Demo processing rule: five working days before pickup.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earliestPickup = addWorkingDays(today, 5);

  const [selectedDate, setSelectedDate] = useState(
    () => dateKey(addWorkingDays(new Date(), 5))
  );

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const earliest = addWorkingDays(new Date(), 5);

    return new Date(
      earliest.getFullYear(),
      earliest.getMonth(),
      1
    );
  });

  // Build the calendar dynamically for the visible month.
  const calendarYear = visibleMonth.getFullYear();
  const calendarMonth = visibleMonth.getMonth();

  const firstWeekday = new Date(
    calendarYear,
    calendarMonth,
    1
  ).getDay();

  const daysInMonth = new Date(
    calendarYear,
    calendarMonth + 1,
    0
  ).getDate();

  const calendarCells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  const minimumMonth = new Date(
    earliestPickup.getFullYear(),
    earliestPickup.getMonth(),
    1
  );

  const canGoToPreviousMonth =
    visibleMonth.getTime() > minimumMonth.getTime();

  function changeMonth(amount) {
    setVisibleMonth((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1
      );

      if (next < minimumMonth) {
        return minimumMonth;
      }

      return next;
    });
  }

  function chooseDate(day) {
    const date = new Date(
      calendarYear,
      calendarMonth,
      day
    );

    date.setHours(0, 0, 0, 0);

    if (date < earliestPickup) {
      return;
    }

    setSelectedDate(dateKey(date));
    setMessage("");
  }

  function handleGenerateTicket() {
    setMessage("");

    if (!validId || !requiredDocument) {
      setMessage(
        "Please upload your valid ID and required document."
      );
      return;
    }

    if (claimant === "someone-else") {
      if (
        !authorizationLetter ||
        !receiverId ||
        !receiverName.trim()
      ) {
        setMessage(
          "Please complete the receiver details and upload the required documents."
        );
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      setMessage("Please select a pickup date and time.");
      return;
    }

    setMessage(
      "Your selections are ready. Ticket generation will be available when the backend is connected."
    );
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="srau-main">
        <h1 className="srau-title">
          University Registrar's Office (SRAU)
        </h1>

        {/* 1. Choose a service */}
        <section className="srau-section">
          <h2>1 · Choose a service</h2>

          <div className="srau-service-grid">
            {services.map((item) => (
              <button
                key={item}
                type="button"
                className={`srau-service-option ${
                  service === item ? "selected" : ""
                }`}
                onClick={() => setService(item)}
                aria-pressed={service === item}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="srau-fee-note">
            <strong>Fee:</strong> ₱ — (paid at the counter) ·{" "}
            <strong>Processing:</strong> 5 working days. The office
            prepares your document before you arrive.
          </div>
        </section>

        {/* 2. Upload requirements */}
        <section className="srau-section">
          <h2>2 · Upload requirements</h2>

          <div className="srau-upload-grid">
            <UploadBox
              title="Valid ID"
              note="No file selected"
              file={validId}
              onChange={(event) =>
                setValidId(event.target.files?.[0] || null)
              }
            />

            <UploadBox
              title="Required document"
              note="Set by the office"
              file={requiredDocument}
              onChange={(event) =>
                setRequiredDocument(event.target.files?.[0] || null)
              }
            />
          </div>

          <p className="srau-help">
            Upload your requirements. Accepted files: PDF, JPG,
            JPEG, or PNG.
          </p>
        </section>

        {/* 3. Claimant */}
        <section className="srau-section">
          <h2>3 · Who will claim the document?</h2>

          <select
            className="srau-claimant-select"
            value={claimant}
            onChange={(event) => setClaimant(event.target.value)}
            aria-label="Who will claim the document?"
          >
            <option value="">
              Select who will claim the document
            </option>
            <option value="me">Me</option>
            <option value="someone-else">Someone else</option>
          </select>

          {claimant === "someone-else" && (
            <>
              <div className="srau-upload-grid srau-claimant-files">
                <UploadBox
                  title="Authorization letter"
                  note="No file selected"
                  file={authorizationLetter}
                  onChange={(event) =>
                    setAuthorizationLetter(
                      event.target.files?.[0] || null
                    )
                  }
                />

                <UploadBox
                  title="Receiver's valid ID"
                  note="No file selected"
                  file={receiverId}
                  onChange={(event) =>
                    setReceiverId(
                      event.target.files?.[0] || null
                    )
                  }
                />
              </div>

              <label className="srau-receiver-name">
                Full name of the receiver

                <input
                  type="text"
                  value={receiverName}
                  onChange={(event) =>
                    setReceiverName(event.target.value)
                  }
                  placeholder="Enter receiver's full name"
                />
              </label>
            </>
          )}
        </section>

        {/* 4. Pickup calendar and time */}
        <section className="srau-section">
          <h2>4 · Pick a pickup date and time</h2>

          <p className="srau-earliest">
            Earliest pickup: {formatDate(earliestPickup)} (after processing).
          </p>

          <div className="srau-schedule">
            <div className="srau-calendar">
              <div className="srau-calendar-header">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  disabled={!canGoToPreviousMonth}
                  aria-label="Previous month"
                >
                  ‹
                </button>

                <h3>{getMonthLabel(visibleMonth)}</h3>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>

              <div className="srau-weekdays">
                {["S", "M", "T", "W", "T", "F", "S"].map(
                  (day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  )
                )}
              </div>

              <div className="srau-calendar-days">
                {calendarCells.map((day, index) => {
                  if (day === null) {
                    return (
                      <span
                        className="srau-calendar-empty"
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const date = new Date(
                    calendarYear,
                    calendarMonth,
                    day
                  );

                  date.setHours(0, 0, 0, 0);

                  const disabled = date < earliestPickup;
                  const isSelected = dateKey(date) === selectedDate;

                  return (
                    <button
                      key={dateKey(date)}
                      type="button"
                      disabled={disabled}
                      className={isSelected ? "selected" : ""}
                      onClick={() => chooseDate(day)}
                      aria-pressed={isSelected}
                      aria-label={formatDate(date)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="srau-time-panel">
              <p className="srau-selected-date">
                {selectedDate
                  ? formatDate(
                      new Date(`${selectedDate}T00:00:00`)
                    )
                  : "Choose a pickup date"}
              </p>

              <div className="srau-time-slots">
                {timeSlots.map((slot) => {
                  const unavailable = slot.left === 0;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={unavailable || !selectedDate}
                      className={
                        selectedTime === slot.time
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setMessage("");
                      }}
                    >
                      <span>{slot.time}</span>
                      <span>
                        {unavailable ? "Full" : `${slot.left} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {message && (
          <p className="srau-message" role="status">
            {message}
          </p>
        )}

        <button
          className="srau-generate-button"
          type="button"
          onClick={handleGenerateTicket}
        >
          Generate ticket
        </button>
      </main>
    </div>
  );
}

