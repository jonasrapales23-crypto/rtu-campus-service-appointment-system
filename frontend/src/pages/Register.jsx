import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Register.css";

export default function Register() {
  function handleRegister(event) {
    event.preventDefault();

    // Remember the email so the verify screen can show it (masked).
    const email = new FormData(event.currentTarget).get("personalEmail");

    try {
      sessionStorage.setItem("rtu-ccsas.pendingEmail", String(email ?? ""));
    } catch {
      // Storage can be blocked; the verify screen then shows "your email".
    }

    window.location.href = "/verify";
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="register-main">
        <section
          className="register-card"
          aria-labelledby="register-heading"
        >
          <h1 id="register-heading">Create account</h1>

          <form onSubmit={handleRegister}>
            <div className="register-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="personalEmail">Personal email</label>
              <input
                id="personalEmail"
                name="personalEmail"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="program">Program / course</label>
              <select id="program" name="program" required defaultValue="">
                <option value="" disabled></option>
                <option value="BSIT">
                  Bachelor of Science in Information Technology
                </option>
                <option value="BSCS">
                  Bachelor of Science in Computer Science
                </option>
                <option value="BSIS">
                  Bachelor of Science in Information Systems
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="register-field">
              <label htmlFor="studentNumber">Student number</label>
              <input
                id="studentNumber"
                name="studentNumber"
                type="text"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="registerPassword">Password</label>
              <input
                id="registerPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <button className="register-button" type="submit">
              Send verification code
            </button>
          </form>

          <p className="back-to-login">
            Already have an account? <a href="/">Sign in</a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}