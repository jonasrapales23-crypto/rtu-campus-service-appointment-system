import { useState } from "react";

export default function Navbar({ activePage = "" }) {
  const [search, setSearch] = useState("");

  function handleSearch(event) {
    event.preventDefault();

    if (search.trim()) {
      alert("Service search will be connected to the backend later.");
    }
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

      <nav className="nav-links" aria-label="Main navigation">
        <a
          href="/home"
          className={activePage === "home" ? "active-nav" : ""}
          aria-current={activePage === "home" ? "page" : undefined}
        >
          Home
        </a>

        <a
          href="/about"
          className={activePage === "about" ? "active-nav" : ""}
          aria-current={activePage === "about" ? "page" : undefined}
        >
          About
        </a>

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
          onClick={() => alert("Logout will be connected later.")}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}