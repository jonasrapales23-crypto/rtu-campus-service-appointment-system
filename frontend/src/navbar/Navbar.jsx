import { useState } from "react";
import "./Navbar.css";

export default function Navbar({ activePage = "", accountType = "student", adminSection = "Dashboard", onAdminNavigate }) {
  // On the search page the box starts with the current query.
  const [search, setSearch] = useState(() =>
    window.location.pathname === "/search"
      ? (new URLSearchParams(window.location.search).get("q") ?? "")
      : ""
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  }

  function handleLogout() {
    // Frontend-only logout: return to the app's sign-in screen.
    window.location.href = "/";
  }

  if (["srau-admin", "misu-admin", "hsu-admin"].includes(accountType)) {
    const adminLinks = accountType === "misu-admin" ? ["Dashboard", "Queue", "Requests", "Records", "Services", "Reports"] : accountType === "hsu-admin" ? ["Dashboard", "Queue", "Bookings", "Slots", "Services", "Reports"] : ["Dashboard", "Queue", "Requests", "Slots", "Services", "Reports"];
    return (
      <header className="navbar shared-admin-navbar">
        <img className="navbar-logo" src="/rtu-logo.png" alt="Rizal Technological University logo" />
        <a className="brand" href="/home" aria-label="RTU-CCSAS home">
          <span className="brand-name">RTU-CCSAS</span>
        </a>
        <nav className="nav-links admin-nav-links" aria-label={`${accountType === "misu-admin" ? "MISU" : accountType === "hsu-admin" ? "HSU" : "SRAU"} admin navigation`}>
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

  return (
    <header className="navbar">
      <img className="navbar-logo" src="/rtu-logo.png" alt="Rizal Technological University logo" />
      <a className="brand" href="/home"><span className="brand-name">RTU-CCSAS</span></a>
      <form className="service-search" onSubmit={handleSearch}>
        <button type="submit" aria-label="Search services">🔍</button>
        <input type="search" placeholder="What service do you need?" value={search}
          onChange={(event) => setSearch(event.target.value)} aria-label="Describe the service you need" />
      </form>
      <button className="nav-burger" type="button" aria-label="Open menu" aria-expanded={menuOpen}
        aria-controls="nav-drawer" onClick={() => setMenuOpen((open) => !open)}>☰</button>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="/home" className={activePage === "home" ? "active-nav" : ""} aria-current={activePage === "home" ? "page" : undefined}>Home</a>
        <a href="/home#about">About</a>
        <a href="/appointments" className={activePage === "appointments" ? "active-nav" : ""}
          aria-current={activePage === "appointments" ? "page" : undefined}>My Appointments</a>
        <div className="account-permission">
          <button className="account-permission-toggle" type="button" aria-expanded={permissionOpen} aria-haspopup="true"
            onClick={() => setPermissionOpen((open) => !open)}>Change acc perm <span aria-hidden="true">▾</span></button>
          {permissionOpen && <div className="account-permission-menu" role="menu">
            <a href="/srau-admin" role="menuitem" onClick={() => setPermissionOpen(false)}>SRAU admin</a>
            <a href="/misu-admin" role="menuitem" onClick={() => setPermissionOpen(false)}>MISU admin</a>
            <a href="/hsu-admin" role="menuitem" onClick={() => setPermissionOpen(false)}>HSU admin</a>
          </div>}
        </div>
        <button className="logout-button" type="button" onClick={handleLogout}>Logout</button>
      </nav>
      {menuOpen && <nav id="nav-drawer" className="nav-drawer" aria-label="Mobile navigation">
        <a href="/home">Home</a><a href="/appointments">My Appointments</a><a href="/appointments?tab=history">History</a>
        <button type="button" className="drawer-permission-toggle" aria-expanded={permissionOpen}
          onClick={() => setPermissionOpen((open) => !open)}>Change acc perm ▾</button>
        {permissionOpen && <><a className="drawer-permission-option" href="/srau-admin" role="menuitem" onClick={() => { setPermissionOpen(false); setMenuOpen(false); }}>SRAU admin</a><a className="drawer-permission-option" href="/misu-admin" role="menuitem" onClick={() => { setPermissionOpen(false); setMenuOpen(false); }}>MISU admin</a><a className="drawer-permission-option" href="/hsu-admin" role="menuitem" onClick={() => { setPermissionOpen(false); setMenuOpen(false); }}>HSU admin</a></>}
        <button type="button" onClick={handleLogout}>Logout</button>
      </nav>}
    </header>
  );
}