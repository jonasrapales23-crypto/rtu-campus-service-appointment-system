import { useState } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { offices } from "../data/offices.js";
import "../styles/Login.css";
import "../styles/Home.css";

export default function Home() {
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [message, setMessage] = useState("");

  // Clicking a card selects it without opening its page.
  function handleOfficeClick(office) {
    setSelectedOffice(office.code);
    setMessage("");
  }

  // Allows users to select a card using Enter or Space.
  function handleOfficeKeyDown(event, office) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOfficeClick(office);
    }
  }

  // Opens the selected office only after clicking Book now.
  function handleBookNow() {
    if (!selectedOffice) {
      setMessage("Please select an office before clicking Book now.");
      return;
    }

    const office = offices.find(
      (item) => item.code === selectedOffice
    );

    if (office?.path) {
      window.location.href = office.path;
    }
  }

  return (
    <div className="site-shell">
      <Navbar activePage="home" />

      <main className="home-main">
        <section className="home-intro" id="about">
          <h1>What is RTU-CCSAS?</h1>

          <div className="home-hero">
            <h2>Skip the long lines at RTU</h2>

            <p>
              RTU-CCSAS is a centralized appointment system for
              campus services. Search for what you need, send your
              request and requirements ahead of time, and pick a
              pickup schedule. You get a control number to bring to
              the office.
            </p>
          </div>
        </section>

        <section className="offices-section">
          <h2>Offices and services offered</h2>

          <p className="office-selection-hint">
            Select an office to continue with your booking.
          </p>

          <div className="office-grid">
            {offices.map((office) => {
              const isSelected =
                selectedOffice === office.code;

              return (
                <article
                  key={office.code}
                  className={`office-card clickable-office ${
                    isSelected ? "selected-office" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleOfficeClick(office)}
                  onKeyDown={(event) =>
                    handleOfficeKeyDown(event, office)
                  }
                >
                  <h3>{office.code}</h3>

                  <p className="office-name">
                    {office.name}
                  </p>

                  <p className="office-services">
                    {office.services}
                  </p>

                  <div className="office-badges">
                    <span className="status-badge">
                      {office.status}
                    </span>

                    <span
                      className={
                        office.showBooking
                          ? "booking-badge"
                          : "booking-badge walk-in-badge"
                      }
                    >
                      {office.booking}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="book-now-row">
            <div className="book-now-content">
              {message && (
                <p className="booking-message" role="status">
                  {message}
                </p>
              )}

              <button
                type="button"
                className="book-now-button"
                onClick={handleBookNow}
              >
                Book now
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
