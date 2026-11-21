import { useState } from "react";
import "./Navbar.css";

export default function Navbar({ activePage = "", accountType = "student", adminSection = "Dashboard", onAdminNavigate }) {
  const [search, setSearch] = useState(() =>
    window.location.pathname === "/search"
      ? (new URLSearchParams(window.location.search).get("q") ?? "")
      : ""
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Updated to include /register so the links are hidden on both auth pages
  const isLoginPage = 
    window.location.pathname === "/login" || 
    window.location.pathname === "/register" || 
    window.location.pathname === "/";

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  }

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }

  // 1. Administrative office dashboard views
  if (["srau-admin", "misu-admin", "hsu-admin", "bau-admin"].includes(accountType)) {
    const adminLinks = accountType === "misu-admin" ? ["Dashboard", "Queue", "Requests", "Records", "Services", "Reports"] : accountType === "hsu-admin" ? ["Dashboard", "Queue", "Bookings", "Slots", "Services", "Reports"] : accountType === "bau-admin" ? ["Dashboard", "Queue", "Requests", "Slots", "Products", "Reports"] : ["Dashboard", "Queue", "Requests", "Slots", "Services", "Reports"];
    return (
      <header className="navbar shared-admin-navbar">
        <img className="navbar-logo" src="/rtu-logo.png" alt="Rizal Technological University logo" />
        <a className="brand" href="/home" aria-label="RTU-CCSAS home">
          <span className="brand-name">RTU-CCSAS</span>
        </a>
        <nav className="nav-links admin-nav-links" aria-label={`${accountType === "misu-admin" ? "MISU" : accountType === "hsu-admin" ? "HSU" : accountType === "bau-admin" ? "BAU" : "SRAU"} admin navigation`}>
          {adminLinks.map((item) => (
            <button key={item} type="button" className={adminSection === item ? "active-nav" : ""}
              aria-current={adminSection === item ? "page" : undefined}
              onClick={() => onAdminNavigate?.(item)}>{item}</button>
          ))}
          <button className="logout-button" type="button" onClick={handleLogout}>Log out</button>
        </nav>
        <button className="nav-burger" type="button" aria-label="Open admin menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}>☰</button>
        {menuOpen && (
          <nav className="nav-drawer" aria-label="Mobile admin navigation">
            {adminLinks.map((item) => <button key={item} type="button" className={adminSection === item ? "active-nav" : ""}
              onClick={() => { onAdminNavigate?.(item); setMenuOpen(false); }}>{item}</button>)}
            <button type="button" onClick={handleLogout}>Log out</button>
          </nav>
        )}
      </header>
    );
  }

  // 2. Standard Student Navbar (Handles hiding buttons and links dynamically based on login/register state)
  return (
    <header className="navbar">
      <img className="navbar-logo" src="/rtu-logo.png" alt="Rizal Technological University logo" />
      
      <a className="brand" href={isLoginPage ? "/login" : "/home"}>
        <span className="brand-name">RTU-CCSAS</span>
      </a>
      
      <form className="service-search" onSubmit={handleSearch}>
        <button type="submit" aria-label="Search services">🔍</button>
        <input type="search" placeholder="What service do you need?" value={search}
          onChange={(event) => setSearch(event.target.value)} aria-label="Describe the service you need" />
      </form>
      
      <button className="nav-burger" type="button" aria-label="Open menu" aria-expanded={menuOpen}
        aria-controls="nav-drawer" onClick={() => setMenuOpen((open) => !open)}>☰</button>
        
      <nav className="nav-links" aria-label="Main navigation">
        <a href={isLoginPage ? "/login" : "/home"} className={activePage === "home" ? "active-nav" : ""}>Home</a>
        <a href={isLoginPage ? "/login#about" : "/home#about"}>About</a>
        
        {/* Hides buttons on both the login screen and registration screen */}
        {!isLoginPage && (
          <>
            <a href="/appointments" className={activePage === "appointments" ? "active-nav" : ""}>My Appointments</a>
            <button className="logout-button" type="button" onClick={handleLogout}>Logout</button>
          </>
        )}
      </nav>
      
      {menuOpen && <nav id="nav-drawer" className="nav-drawer" aria-label="Mobile navigation">
        <a href={isLoginPage ? "/login" : "/home"}>Home</a>
        {!isLoginPage && (
          <>
            <a href="/appointments">My Appointments</a>
            <a href="/appointments?tab=history">History</a>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        )}
      </nav>}
    </header>
  );
}