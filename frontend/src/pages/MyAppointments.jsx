import Navbar from "../components/Navbar.jsx";
import "../styles/Login.css";
import "../styles/MyAppointments.css";

export default function MyAppointments() {
  return (
    <div className="site-shell">
      <Navbar activePage="appointments" />

      <main className="appointments-main">
        <h1>My Appointments</h1>
      </main>
    </div>
  );
}

