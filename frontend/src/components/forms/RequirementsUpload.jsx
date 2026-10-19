import UploadBox from "./UploadBox.jsx";

// Step "Upload requirements": valid ID + the office's required document.
export default function RequirementsUpload({
  validId,
  onValidIdChange,
  requiredDocument,
  onRequiredDocumentChange,
}) {
  return (
    <section className="srau-section">
      <h2>2 · Upload requirements</h2>

      <div className="srau-upload-grid">
        <UploadBox
          title="Valid ID"
          note="No file selected"
          file={validId}
          onChange={(event) =>
            onValidIdChange(event.target.files?.[0] || null)
          }
        />

        <UploadBox
          title="Required document"
          note="Set by the office"
          file={requiredDocument}
          onChange={(event) =>
            onRequiredDocumentChange(event.target.files?.[0] || null)
          }
        />
      </div>

      <p className="srau-help">
        Upload your requirements. Accepted files: PDF, JPG, JPEG, or PNG.
      </p>
    </section>
  );
}
