import { useState } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Register.css";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Communicates with the Express backend to process user registration info
  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    
    // Combine First Name and Last Name to match the backend fullName constraint
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    
    const email = String(formData.get("personalEmail") || "").trim();
    const studentNumber = String(formData.get("studentNumber") || "").trim();
    const password = String(formData.get("password") || "");

    // Structure properties cleanly to fit table column layouts
    const payload = {
      studentNumber,
      fullName,
      email,
      password
    };

    try {
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration pipeline failed.");
      }

      // Store authentic session context keys locally upon successful registration run
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userOffice", "");
      localStorage.setItem("profileName", data.user.name);
      localStorage.setItem("studentNumber", data.user.studentNumber);

      // Route the fresh student instantly into their homepage booking screen
      window.location.href = "/home";
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="program">Program / course</label>
              <select id="program" name="program" required defaultValue="" disabled={loading}>
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
                placeholder="e.g. 2024-00123"
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {message && (
              <p className="form-message" role="status" style={{ color: "#b4232c", fontSize: "12px", margin: "10px 0", fontWeight: "bold" }}>
                {message}
              </p>
            )}

            <button className="register-button" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
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