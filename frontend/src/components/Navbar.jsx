import { useState } from "react";
import "../styles/Navbar.css";

export default function Navbar({ activePage = "" }) {
  // On the search page the box starts with the current query.
  const [search, setSearch] = useState(() =>
    window.location.pathname === "/search"
      ? (new URLSearchParams(window.location.search).get("q") ?? "")
      : ""
  );
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  }

  function handleLogout() {
    alert("Logout will be connected later.");
  }

  return (
    <header className="navbar">
      <img
        className="navbar-logo"
        src="/rtu-logo.png"
        alt="Rizal Technological University logo"
      />

      <a className="brand" href="/home">
        <span className="brand-name">RTU-CCSAS</span>
      </a>

      <form className="service-search" onSubmit={handleSearch}>
        <button type="submit" aria-label="Search services">
          🔍
        </button>

        <input
          type="search"
          placeholder="What service do you need?"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Describe the service you need"
        />
      </form>

      <button
        className="nav-burger"
        type="button"
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="nav-drawer"
        onClick={() => setMenuOpen((open) => !open)}
      >
        ☰
      </button>

      <nav className="nav-links" aria-label="Main navigation">
        <a
          href="/home"
          className={activePage === "home" ? "active-nav" : ""}
          aria-current={activePage === "home" ? "page" : undefined}
        >
          Home
        </a>

        <a href="/home#about">About</a>

        <a
          href="/appointments"
          className={
            activePage === "appointments" ? "active-nav" : ""
          }
          aria-current={
            activePage === "appointments" ? "page" : undefined
          }
        >
          My Appointments
        </a>

        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      {menuOpen && (
        <nav
          id="nav-drawer"
          className="nav-drawer"
          aria-label="Mobile navigation"
        >
          <a href="/home">Home</a>
          <a href="/appointments">My Appointments</a>
          <a href="/appointments?tab=history">History</a>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
