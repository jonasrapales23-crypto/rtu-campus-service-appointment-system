import { useState } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!username.trim() || !password) {
      setMessage("Please enter your credentials.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: username.trim(), password }),
});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userOffice", data.officeCode || "");
      localStorage.setItem("profileName", data.user.name);
      localStorage.setItem("studentNumber", data.user.studentNumber || "");

      if (data.role === "student") {
        window.location.href = "/home";
      } else {
        const officePath = String(data.officeCode).toLowerCase();
        window.location.href = `/${officePath}-admin`;
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site-shell">
      {/* Navbar will automatically detect the /login path and hide all active user links */}
      <Navbar />

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <h1 id="login-heading">Sign in</h1>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="username">Student ID or Admin Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="e.g. 2024-00123 or SrauAdmin"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
            <p className="register-prompt">
              No account yet?{" "}
              <a href="/register">Register</a>
            </p>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}