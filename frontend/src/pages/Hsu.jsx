import { useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "../styles/Login.css";
import "../styles/hsu.css";

const services = [
  {
    id: "freshmen",
    category: "MEDICAL SERVICES",
    title: "Medical Assessment for Freshmen",
    duration: 10,
    description: "Medical assessment for incoming freshmen students.",
  },
  {
    id: "internship",
    category: "MEDICAL SERVICES",
    title: "Medical Assessment for Internship (COE/Practice Teaching)",
    duration: 2,
    description: "Medical assessment required for internship or practice teaching.",
  },
  {
    id: "dental",
    category: "DENTAL SERVICES",
    title: "Dental Examination for Freshmen",
    duration: 5,
    description: "Dental examination for incoming freshmen students.",
  },
];

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

export default function Hsu() {
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
    phone: "",
    email: "",
    comments: "",
    studentNumber: "",
    lastName: "",
    firstName: "",
    course: "",
  });

  const [ticketNumber, setTicketNumber] = useState("");

  const selectedDateLabel = useMemo(
    () => formatDate(selectedDate),
    [selectedDate]
  );

  function chooseService(service) {
    setSelectedService(service);
    setSelectedTime("");
    setStep("booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function confirmAppointment(event) {
    event.preventDefault();

    const requiredFields = [
      form.fullName,
      form.phone,
      form.email,
      form.studentNumber,
      form.lastName,
      form.firstName,
      form.course,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      alert("Please complete all required fields.");
      return;
    }

    if (!selectedTime) {
      alert("Please select an appointment time.");
      return;
    }

    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    setTicketNumber(`HSU-${randomNumber}`);
    setStep("ticket");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startOver() {
    setStep("services");
    setSelectedService(null);
    setSelectedTime("");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);

    setTicketNumber("");

    setForm({
      fullName: "",
      phone: "",
      email: "",
      comments: "",
      studentNumber: "",
      lastName: "",
      firstName: "",
      course: "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="hsu-main">
        {step !== "ticket" && (
          <header className="hsu-page-heading">
            <p className="hsu-eyebrow">RTU CAMPUS SERVICES</p>
            <h1>Health Services Unit (HSU)</h1>
            <p>
              Schedule your medical and dental appointments
              through the Health Services Unit.
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

              {["MEDICAL SERVICES", "DENTAL SERVICES"].map((category) => (
                <div className="hsu-service-category" key={category}>
                  <h3>{category}</h3>

                  {services
                    .filter((service) => service.category === category)
                    .map((service) => (
                      <button
                        type="button"
                        className="hsu-service-option"
                        key={service.id}
                        onClick={() => chooseService(service)}
                      >
                        <span className="hsu-service-icon">
                          {service.id === "dental" ? "🦷" : "🩺"}
                        </span>

                        <span className="hsu-service-copy">
                          <strong>{service.title}</strong>
                          <small>{service.duration} mins · Free</small>
                        </span>

                        <span className="hsu-service-arrow">›</span>
                      </button>
                    ))}
                </div>
              ))}
            </section>
          </>
        )}

        {/* DETAILS AND SCHEDULING ON ONE PAGE */}
        {step === "booking" && selectedService && (
          <>
            <div className="hsu-step-heading">
              <button
                type="button"
                className="hsu-back-button"
                onClick={() => setStep("services")}
              >
                ‹
              </button>
              <h2>Complete your appointment</h2>
            </div>

            <form
              className="hsu-booking-form"
              onSubmit={confirmAppointment}
            >
              {/* YOUR DETAILS FIRST */}
              <section className="hsu-panel hsu-details-form">
                <div className="hsu-panel-heading">
                  <h2>1 · Your details</h2>
                  <p>
                    Please provide your information before selecting
                    your appointment schedule.
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
                    <span>Phone *</span>
                    <div className="hsu-phone-input">
                      <span>+63</span>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={updateForm}
                        placeholder="9XX XXX XXXX"
                        inputMode="tel"
                        required
                      />
                    </div>
                  </label>

                  <label className="hsu-form-field">
                    <span>Email *</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateForm}
                      placeholder="yourname@rtu.edu.ph"
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

                  <label className="hsu-form-field">
                    <span>Last Name *</span>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={updateForm}
                      placeholder="Enter your last name"
                      required
                    />
                  </label>

                  <label className="hsu-form-field">
                    <span>First Name *</span>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={updateForm}
                      placeholder="Enter your first name"
                      required
                    />
                  </label>

                  <label className="hsu-form-field">
                    <span>Course / Major *</span>
                    <input
                      name="course"
                      value={form.course}
                      onChange={updateForm}
                      placeholder="e.g. BSIT"
                      required
                    />
                  </label>

                  <label className="hsu-form-field hsu-comments-field">
                    <span>Comments</span>
                    <textarea
                      name="comments"
                      value={form.comments}
                      onChange={updateForm}
                      rows="3"
                      placeholder="Add any additional information (optional)"
                    />
                  </label>
                </div>

                <div className="hsu-policy-box">
                  <h3>Booking policy</h3>
                  <p>
                    Please avoid double booking. Submitting multiple
                    or repeated bookings may be considered a violation
                    of the appointment policy.
                  </p>

                  <h3>Cancellation policy</h3>
                  <p>
                    You can cancel or reschedule your appointment
                    before the appointment time.
                  </p>

                  <h3>Additional information</h3>
                  <p>
                    When booking with the Health Services Unit,
                    you may receive appointment-specific
                    communications and reminders.
                  </p>
                </div>
              </section>

              {/* PICKUP / APPOINTMENT DATE AND TIME SECOND */}
              <section className="hsu-panel hsu-schedule-panel">
                <div className="hsu-panel-heading">
                  <h2>2 · Pick a date and time</h2>
                  <p>
                    {selectedService.title} · {selectedService.duration} mins · Free
                  </p>
                  <p>Select an available appointment date and time.</p>
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

                    <label className="hsu-timezone">
                      <span>Time zone</span>
                      <select defaultValue="Asia/Manila" disabled>
                        <option value="Asia/Manila">
                          Philippines - Manila
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="hsu-time-column">
                    <h3>{selectedDateLabel}</h3>

                    <div className="hsu-time-grid">
                      {timeSlots
                        .filter(
                          (time) =>
                            selectedService.duration !== 10 ||
                            (time !== "4:50 PM" && time !== "4:55 PM")
                        )
                        .map((time) => (
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
                <button type="submit" className="hsu-primary-button">
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
                <p><strong>HEALTH SERVICES UNIT</strong></p>
                <p>{selectedService.title}</p>
                <p>{form.fullName}</p>
                <p>{form.studentNumber}</p>
                <p>{formatDate(selectedDate)} · {selectedTime}</p>
              </div>

              <div className="hsu-ticket-note">
                Appointment fee: <strong>FREE</strong>
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
                  Back to HSU
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
