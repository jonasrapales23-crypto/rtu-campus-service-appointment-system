
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img
          src="/rtu-logo.png"
          alt="Rizal Technological University Logo"
          className="footer-logo"
        />

        <span>Rizal Technological University</span>
      </div>

      <div className="social-links">
        <a
          href="https://www.facebook.com/"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>

        <span>·</span>

        <a
          href="https://www.linkedin.com/"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>

        <span>·</span>

        <a
          href="https://www.youtube.com/"
          target="_blank"
          rel="noreferrer"
        >
          YouTube
        </a>

        <span>·</span>

        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
      </div>
    </footer>
  );
}
