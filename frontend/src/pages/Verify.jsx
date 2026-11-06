import { useEffect, useRef, useState } from "react";
import Navbar from "../navbar/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/Register.css";
import "../styles/Features.css";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

// "juan@gmail.com" -> "ju***@gmail.com"
function maskEmail(email) {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function readPendingEmail() {
  try {
    return sessionStorage.getItem("rtu-ccsas.pendingEmail") ?? "";
  } catch {
    return "";
  }
}

export default function Verify() {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [message, setMessage] = useState("");
  const inputs = useRef([]);
  const email = readPendingEmail();

  useEffect(() => {
    if (seconds <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  function setDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setDigits((current) =>
      current.map((item, position) => (position === index ? digit : item))
    );
    setMessage("");

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(event, index) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    setDigits(
      Array.from({ length: CODE_LENGTH }, (_, index) => pasted[index] ?? "")
    );
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  function handleVerify(event) {
    event.preventDefault();

    if (digits.some((digit) => !digit)) {
      setMessage("Please enter the 6-digit code we sent to your email.");
      return;
    }

    setMessage(
      "Code entered. Email verification will be checked when the backend is connected."
    );
  }

  function handleResend() {
    setDigits(Array(CODE_LENGTH).fill(""));
    setSeconds(RESEND_SECONDS);
    setMessage("A new code will be sent when the backend is connected.");
    inputs.current[0]?.focus();
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(
    2,
    "0"
  )}`;

  return (
    <div className="site-shell">
      <Navbar />

      <main className="register-main">
        <section
          className="register-card"
          aria-labelledby="verify-heading"
        >
          <h1 id="verify-heading">Verify your email</h1>

          <p className="verify-text">
            We sent a 6-digit code to {email ? maskEmail(email) : "your email"}.
            It expires in 10 minutes.
          </p>

          <form onSubmit={handleVerify}>
            <div
              className="verify-code"
              onPaste={handlePaste}
              role="group"
              aria-label="6-digit verification code"
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${index + 1}`}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                />
              ))}
            </div>

            {message && (
              <p className="register-message" role="status">
                {message}
              </p>
            )}

            <button className="register-button" type="submit">
              Verify
            </button>
          </form>

          <p className="back-to-login">
            Did not get it?{" "}
            {seconds > 0 ? (
              <span>Resend in {clock}</span>
            ) : (
              <button
                type="button"
                className="verify-resend"
                onClick={handleResend}
              >
                Resend code
              </button>
            )}{" "}
            · <a href="/register">Use a different email</a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
