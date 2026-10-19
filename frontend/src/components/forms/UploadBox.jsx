// A single file-upload tile (valid ID, authorization letter, etc.).
export default function UploadBox({ title, note, file, onChange }) {
  return (
    <label className="srau-upload-box">
      <span className="upload-icon" aria-hidden="true">
        📄 ↑
      </span>

      <span>{title}</span>

      {file ? (
        <span className="upload-file-name">{file.name}</span>
      ) : (
        <span className="upload-note">{note}</span>
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
