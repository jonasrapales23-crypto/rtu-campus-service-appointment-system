import UploadBox from "./UploadBox.jsx";

// Step "Who will claim the document?" (me / someone else + receiver files).
// `value` holds { claimant, authorizationLetter, receiverId, receiverName }.
export default function ClaimantSection({ value, onChange }) {
  const { claimant, authorizationLetter, receiverId, receiverName } = value;

  function update(patch) {
    onChange({ ...value, ...patch });
  }

  return (
    <section className="srau-section">
      <h2>3 · Who will claim the document?</h2>

      <select
        className="srau-claimant-select"
        value={claimant}
        onChange={(event) => update({ claimant: event.target.value })}
        aria-label="Who will claim the document?"
      >
        <option value="">Select who will claim the document</option>
        <option value="me">Me</option>
        <option value="someone-else">Someone else</option>
      </select>

      {claimant === "someone-else" && (
        <>
          <div className="srau-upload-grid srau-claimant-files">
            <UploadBox
              title="Authorization letter"
              note="No file selected"
              file={authorizationLetter}
              onChange={(event) =>
                update({
                  authorizationLetter: event.target.files?.[0] || null,
                })
              }
            />

            <UploadBox
              title="Receiver's valid ID"
              note="No file selected"
              file={receiverId}
              onChange={(event) =>
                update({ receiverId: event.target.files?.[0] || null })
              }
            />
          </div>

          <label className="srau-receiver-name">
            Full name of the receiver
            <input
              type="text"
              value={receiverName}
              onChange={(event) =>
                update({ receiverName: event.target.value })
              }
              placeholder="Enter receiver's full name"
            />
          </label>
        </>
      )}
    </section>
  );
}
