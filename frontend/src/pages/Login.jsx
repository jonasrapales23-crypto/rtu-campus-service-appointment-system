import { useState } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your RTU email and password.");
      return;
    }

    setMessage("Login is not connected to the backend yet.");
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <h1 id="login-heading">Sign in</h1>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">RTU email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your RTU email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button className="login-button" type="submit">
              Login
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