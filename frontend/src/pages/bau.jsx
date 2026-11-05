import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "../styles/Login.css";
import "../styles/bau.css";

const books = [
  { code: "6617", title: "Treasury Management", price: 325 },
  {
    code: "6647",
    title: "The Steno Code: Unleashing the Potential of Machine Shorthand",
    price: 400,
  },
  { code: "6523", title: "Understanding the Self", price: 420 },
  { code: "6524", title: "Readings in Philippine History", price: 325 },
  {
    code: "6525",
    title: "The Contemporary World: A Social Science Perspective",
    price: 390,
  },
  {
    code: "6527",
    title: "Communicate and Connect: Purposive Communication",
    price: 550,
  },
  {
    code: "6528",
    title: "An Eye for Art Appreciation: Perception and Expression, 2nd Edition",
    price: 475,
  },
  { code: "6530", title: "Ethics for the Modern Student", price: 425 },
  { code: "6531", title: "The Life and Works of Jose Rizal", price: 400 },
  {
    code: "6557",
    title: "National Service Training Program I, 2023 Edition",
    price: 450,
  },
  {
    code: "6616",
    title: "Productivity and Quality Tools for Enhanced Performance",
    price: 425,
  },
  {
    code: "6608",
    title: "Facilities and Management, Second Edition",
    price: 500,
  },
  { code: "6613", title: "Management Information System", price: 350 },
  {
    code: "6651",
    title: "Obligations and Contracts, Second Edition",
    price: 425,
  },
  {
    code: "6612",
    title: "Introduction to Human Resource Management",
    price: 395,
  },
  {
    code: "6537",
    title: "Labor Law and Legislation, Second Edition",
    price: 525,
  },
];

const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const schoolUniformItems = {
  Male: ["Polo", "Pants"],
  Female: ["Blouse", "Pants", "Skirt"],
};

const peUniformItems = ["T-Shirt", "Pants"];

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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function ClothingCard({ title, selectedSize, onSelectSize }) {
  return (
    <div
      className={`bau-clothing-card ${
        selectedSize ? "bau-clothing-card-selected" : ""
      }`}
    >
      <h3>{title}</h3>
      <p>Select size</p>

      <div className="bau-size-options">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            className={`bau-size-button ${
              selectedSize === size ? "active" : ""
            }`}
            aria-pressed={selectedSize === size}
            onClick={() => onSelectSize(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

function PickupCalendar({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

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

  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";

  return (
    <section className="hsu-panel hsu-schedule-panel bau-pickup-section">
      <div className="hsu-panel-heading">
        <h2>2 · Pick a date and time</h2>
        <p>Select an available pickup date and time.</p>
      </div>

      <div className="hsu-schedule-content">
        <div className="hsu-calendar-column">
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
              {["S", "M", "T", "W", "T", "F", "S"].map(
                (day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                )
              )}
            </div>

            <div className="hsu-calendar-days">
              {days.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} />;
                }

                const date = new Date(year, month, day);
                date.setHours(0, 0, 0, 0);

                const dateKey = formatDate(date);
                const disabled = date < today;

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    className={
                      selectedDate === dateKey ? "selected" : ""
                    }
                    onClick={() => {
                      onSelectDate(dateKey);
                      onSelectTime("");
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hsu-time-column">
          <h3>{selectedDateLabel}</h3>

          <div className="hsu-time-grid">
            {timeSlots.map((time) => (
              <button
                type="button"
                key={time}
                disabled={!selectedDate}
                className={selectedTime === time ? "selected" : ""}
                onClick={() => onSelectTime(time)}
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
  );
}

export default function Bau() {
  const [category, setCategory] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [gender, setGender] = useState("");
  const [schoolSelections, setSchoolSelections] = useState({});
  const [peSelections, setPeSelections] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [showTicket, setShowTicket] = useState(false);

  const selectedBookDetails = books.find(
    (book) => book.code === selectedBook
  );

  function resetSchedule() {
    setSelectedDate("");
    setSelectedTime("");
  }

  function backToServices() {
    setCategory("");
    setSelectedBook("");
    setGender("");
    setSchoolSelections({});
    setPeSelections({});
    setMessage("");
    resetSchedule();
    setShowTicket(false);
  }

  function handleCategoryChange(selectedCategory) {
    setCategory(selectedCategory);
    setSelectedBook("");
    setGender("");
    setSchoolSelections({});
    setPeSelections({});
    setMessage("");
    resetSchedule();
    setShowTicket(false);
  }

  function handleGenderChange(option) {
    setGender(option);
    setSchoolSelections({});
    setPeSelections({});
    setMessage("");
    resetSchedule();
  }

  function handleClothingSize(section, item, size) {
    const updateSelections =
      section === "school" ? setSchoolSelections : setPeSelections;

    updateSelections((previous) => ({
      ...previous,
      [item]: previous[item] === size ? "" : size,
    }));

    setMessage("");
  }

  function handleGenerateTicket() {
    if (category === "Books" && !selectedBookDetails) {
      setMessage("Please select a book first.");
      return;
    }

    if (category === "Uniform") {
      if (!gender) {
        setMessage("Please select Male or Female first.");
        return;
      }

      const missingSchoolItems = schoolUniformItems[gender].filter(
        (item) => !schoolSelections[item]
      );

      const missingPeItems = peUniformItems.filter(
        (item) => !peSelections[item]
      );

      if (missingSchoolItems.length || missingPeItems.length) {
        setMessage(
          "Please select a size for every school uniform and PE uniform item."
        );
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      setMessage("Please choose a pickup date and time.");
      return;
    }

    setMessage("");
    setShowTicket(true);
  }

  if (showTicket) {
    return (
      <div className="site-shell">
        <Navbar />

        <main className="bau-main bau-ticket-main">
          <h1 className="bau-ticket-title">Your ticket</h1>

          <section className="bau-ticket-card">
            <p className="bau-ticket-control-label">Control number</p>
            <h2 className="bau-ticket-control-number">&nbsp;</h2>

            <div className="bau-ticket-details">
              {/* Ticket details will be added here later. */}
            </div>

            <button
              type="button"
              className="bau-primary-button"
              onClick={() => setShowTicket(false)}
            >
              Back to BAU
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="bau-main">
        <header className="bau-page-heading">
          <p className="bau-eyebrow">RTU CAMPUS SERVICES</p>
          <h1>Business Affairs Unit (BAU)</h1>
          <p>
            Browse and select products and services offered by the Business
            Affairs Unit.
          </p>
        </header>

        <div className="bau-step-heading">
          <button
            type="button"
            className="bau-back-button"
            onClick={
              category
                ? backToServices
                : () => {
                    window.location.href = "/home";
                  }
            }
            aria-label={category ? "Back to services" : "Back to home"}
          >
            ‹
          </button>

          <h2>{category || "Select a service"}</h2>
        </div>

        {!category && (
          <section className="bau-panel">
            <div className="bau-panel-heading">
              <h2>Available Services</h2>
              <p>Choose the product or service you need to continue.</p>
            </div>

            <div className="bau-category-grid">
              {[
                {
                  name: "Books",
                  description: "Browse available books and their prices.",
                  icon: "📚",
                },
                {
                  name: "Uniform",
                  description: "Choose your school and PE uniform sizes.",
                  icon: "👕",
                },
                {
                  name: "Graduation Picture",
                  description: "View graduation pictorial information.",
                  icon: "📸",
                },
                {
                  name: "Sablay",
                  description: "View Sablay information.",
                  icon: "🎓",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className="bau-category-card"
                  onClick={() => handleCategoryChange(item.name)}
                >
                  <span className="bau-category-icon" aria-hidden="true">
                    {item.icon}
                  </span>

                  <span className="bau-category-copy">
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span className="bau-category-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {category === "Books" && (
          <>
            <section className="bau-panel">
              <div className="bau-panel-heading">
                <h2>1 · Your details</h2>
                <p>Please select the book you want to purchase.</p>
              </div>

              <label className="bau-field">
                <span>Select a Book *</span>
                <select
                  value={selectedBook}
                  onChange={(event) => {
                    setSelectedBook(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">-- Choose a book --</option>
                  {books.map((book) => (
                    <option key={book.code} value={book.code}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>

              {selectedBookDetails && (
                <div className="bau-book-details">
                  <span className="bau-detail-label">SELECTED BOOK</span>
                  <h3>{selectedBookDetails.title}</h3>

                  <div className="bau-detail-row">
                    <span>Book Code</span>
                    <strong>{selectedBookDetails.code}</strong>
                  </div>

                  <div className="bau-detail-row">
                    <span>Price</span>
                    <strong className="bau-price">
                      ₱{selectedBookDetails.price.toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            <PickupCalendar
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
            />
          </>
        )}

        {category === "Uniform" && (
          <>
            <section className="bau-panel">
              <div className="bau-panel-heading">
                <h2>1 · Your details</h2>
                <p>
                  Choose your gender and select the sizes for your school and
                  PE uniforms.
                </p>
              </div>

              <div className="bau-form-field">
                <span>Gender *</span>

                <div className="bau-gender-options">
                  {["Male", "Female"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`bau-gender-button ${
                        gender === option ? "active" : ""
                      }`}
                      aria-pressed={gender === option}
                      onClick={() => handleGenderChange(option)}
                    >
                      <span className="bau-radio-dot" />
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {gender && (
                <div className="bau-uniform-grid">
                  <div className="bau-uniform-panel">
                    <div className="bau-uniform-panel-heading">
                      <h3>School Uniform</h3>
                      <p>
                        {gender === "Male"
                          ? "Choose your Polo and Pants sizes."
                          : "Choose your Blouse, Pants, and Skirt sizes."}
                      </p>
                    </div>

                    <div className="bau-clothing-grid">
                      {schoolUniformItems[gender].map((item) => (
                        <ClothingCard
                          key={item}
                          title={item}
                          selectedSize={schoolSelections[item] || ""}
                          onSelectSize={(size) =>
                            handleClothingSize("school", item, size)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bau-uniform-panel">
                    <div className="bau-uniform-panel-heading">
                      <h3>PE Uniform</h3>
                      <p>Choose your PE T-Shirt and Pants sizes.</p>
                    </div>

                    <div className="bau-clothing-grid">
                      {peUniformItems.map((item) => (
                        <ClothingCard
                          key={item}
                          title={item}
                          selectedSize={peSelections[item] || ""}
                          onSelectSize={(size) =>
                            handleClothingSize("pe", item, size)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {gender && (
              <PickupCalendar
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            )}
          </>
        )}

        {category === "Graduation Picture" && (
          <section className="bau-panel bau-info-panel">
            <div className="bau-large-icon" aria-hidden="true">
              📸
            </div>
            <h2>Graduation Picture</h2>
            <p>
              View information about the graduation pictorial service offered
              through BAU.
            </p>
          </section>
        )}

        {category === "Sablay" && (
          <section className="bau-panel bau-info-panel">
            <div className="bau-large-icon" aria-hidden="true">
              🎓
            </div>
            <h2>Sablay</h2>
            <p>View information about Sablay offered through BAU.</p>
          </section>
        )}

        {(category === "Books" || category === "Uniform") && (
          <section className="bau-action-section">
            <button
              type="button"
              className="bau-primary-button"
              onClick={handleGenerateTicket}
            >
              Generate Ticket
            </button>

            {message && (
              <p className="bau-message" role="status">
                {message}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}