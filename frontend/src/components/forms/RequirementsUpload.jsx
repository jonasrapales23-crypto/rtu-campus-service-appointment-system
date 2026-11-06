import UploadBox from "./UploadBox.jsx";

// Step "Upload requirements": valid ID + the office's required document.
// Offices that only need a valid ID leave out `onRequiredDocumentChange`.
// `help` adds an office-specific line under the tiles.
export default function RequirementsUpload({
  step = 2,
  help,
  validId,
  onValidIdChange,
  requiredDocument,
  onRequiredDocumentChange,
}) {
  return (
    <section className="srau-section">
      <h2>{step} · Upload requirements</h2>

      <div className="srau-upload-grid">
        <UploadBox
          title="Valid ID"
          note="No file selected"
          file={validId}
          onChange={(event) =>
            onValidIdChange(event.target.files?.[0] || null)
          }
        />

        {onRequiredDocumentChange && (
          <UploadBox
            title="Required document"
            note="Set by the office"
            file={requiredDocument}
            onChange={(event) =>
              onRequiredDocumentChange(event.target.files?.[0] || null)
            }
          />
        )}
      </div>

      <p className="srau-help">
        Upload your requirements. Accepted files: PDF, JPG, JPEG, or PNG.
        Each upload is checked as soon as you add it. Green means accepted;
        red means not accepted.
      </p>

      {help && <p className="srau-help">{help}</p>}
    </section>
  );
}
