import { checkUpload } from "../../utils/uploadCheck.js";

// A single file-upload tile (valid ID, authorization letter, etc.).
// Shows green "Accepted" or red "Not accepted" (with the reason) as soon
// as a file is added.
export default function UploadBox({ title, note, file, onChange }) {
  const result = checkUpload(file);
  const state = !result ? "" : result.ok ? "accepted" : "rejected";

  return (
    <label className={`srau-upload-box ${state}`}>
      <span className="upload-icon" aria-hidden="true">
        📄 ↑
      </span>

      <span>{title}</span>

      {file ? (
        <span className="upload-file-name">{file.name}</span>
      ) : (
        <span className="upload-note">{note}</span>
      )}

      {result && (
        <span
          className={`upload-status ${state}`}
          role="status"
        >
          {result.ok ? "✓ Accepted" : "✕ Not accepted"}
        </span>
      )}

      {result && !result.ok && (
        <span className="upload-reason">{result.reason}</span>
      )}

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onChange}
      />

      <span className="upload-action">
        {file ? "Change file" : "Choose file"}
      </span>
    </label>
  );
}
