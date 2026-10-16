
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Login.css";
import "../styles/Home.css";

const offices = [
  {
    code: "HSU",
    name: "Health Service Unit",
    services: "Medical assessment, dental exam, consultations",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
  },
  {
    code: "SRAU",
    name: "University Registrar's Office",
    services: "TOR, certificates, CTC, diploma",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
  },
  {
    code: "MISU",
    name: "Management Information Unit",
    services: "Registration form, grade slip, other services",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Served as students arrive",
    showBooking: false,
  },
  {
    code: "BAU",
    name: "Business Affairs Unit",
    services: "Uniforms, books, Sablay, graduation pictorial, concessionaires",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
  },
];

export default function Home() {
  function handleBookNow() {
    window.location.href = "/appointments";
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

          <div className="office-grid">
            {offices.map((office) => (
              <article className="office-card" key={office.code}>
                <h3>{office.code}</h3>
                <p className="office-name">{office.name}</p>
                <p className="office-services">{office.services}</p>

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
            ))}
          </div>

          <div className="book-now-row">
            <button
              type="button"
              className="book-now-button"
              onClick={handleBookNow}
            >
              Book now
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
