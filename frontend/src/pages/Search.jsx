import Navbar from "../components/Navbar.jsx";
import { searchServices } from "../data/serviceCatalog.js";
import { offices } from "../data/offices.js";
import "../styles/Login.css";
import "../styles/Srau.css";
import "../styles/Features.css";

export default function Search() {
  const query = new URLSearchParams(window.location.search).get("q") ?? "";
  const results = searchServices(query);

  return (
    <div className="site-shell">
      <Navbar />

      <main className="srau-main">
        <h1 className="srau-title">Results for "{query}"</h1>

        {results.length === 0 && (
          <>
            <p className="srau-fee-note">
              No services match that search. Try a different word, or pick
              an office below.
            </p>

            <div className="srau-service-grid">
              {offices.map((office) => (
                <a
                  key={office.code}
                  className="srau-service-option srau-link-tile"
                  href={office.path}
                >
                  {office.code} · {office.name}
                </a>
              ))}
            </div>
          </>
        )}

        {results.map((item, index) => (
          <article
            className="appt-card"
            key={`${item.officeCode}-${item.name}`}
          >
            <div className="appt-main">
              <strong>
                {item.name}
                {index === 0 && (
                  <span className="appt-badge ok search-best">
                    Best match
                  </span>
                )}
              </strong>
              <span>
                {[
                  item.officeCode,
                  item.requirements,
                  item.fee,
                  item.processing,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            <a
              className="srau-generate-button srau-book-link"
              href={`${item.path}?service=${encodeURIComponent(item.name)}`}
            >
              {item.mode === "walkin" ? "View" : "Book"}
            </a>
          </article>
        ))}

        {results.length > 0 && (
          <p className="srau-help">
            Each result shows requirements, fee and processing time.
          </p>
        )}
      </main>
    </div>
  );
}
