
import { useState } from "react";
import Navbar from "../../navbar/Navbar.jsx";
import Modal from "../../components/Modal.jsx";
import ServicePicker from "../../components/forms/ServicePicker.jsx";
import RequirementsUpload from "../../components/forms/RequirementsUpload.jsx";
import ClaimantSection from "../../components/forms/ClaimantSection.jsx";
import PickupScheduler from "../../components/scheduling/PickupScheduler.jsx";
import usePickupSchedule from "../../hooks/usePickupSchedule.js";
import {
  availableSlots,
  createAppointment,
} from "../../services/appointments.js";
import { currentStudent } from "../../data/student.js";
import { checkUpload } from "../../utils/uploadCheck.js";
import { formatDate, parseDateKey } from "../../utils/dates.js";
import "../../styles/Login.css";
import "../../styles/Srau.css";
import "../../styles/Features.css";
import BAUDetails, {
  EMPTY_BAU_DETAILS,
} from "../../components/forms/BAUDetails.jsx";
import {
  bauBooks,
  bauSchoolUniformItems,
  bauPeUniformItems,
} from "../../data/bauCatalog.js";

// One booking page for every office (SRAU, HSU, BAU, MISU).
export default function OfficeBookingPage({ config }) {
  const requestedService = new URLSearchParams(window.location.search).get(
    "service"
  );

  const [service, setService] = useState(
    config.services.includes(requestedService)
      ? requestedService
      : config.services[0]
  );
  const [bauDetails, setBauDetails] = useState(EMPTY_BAU_DETAILS);
  const [validId, setValidId] = useState(null);
  const [requiredDocument, setRequiredDocument] = useState(null);
  const [claimant, setClaimant] = useState({
    claimant: "",
    authorizationLetter: null,
    receiverId: null,
    receiverName: "",
  });
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slotTaken, setSlotTaken] = useState(null);

  const selectedBook = bauBooks.find(
    (book) => book.code === bauDetails.bookCode
  );

  const isWalkIn = config.mode === "walkin";
  const isPickup = config.mode === "pickup";
  const kind = isPickup ? "pickup" : "appointment";
  const needsValidId = Boolean(config.requirements?.validId);
  const needsDocument = Boolean(config.requirements?.requiredDocument);
  const hasUploads = needsValidId || needsDocument;
  const someoneElse = claimant.claimant === "someone-else";

  const uploadStep = 2;
  const claimantStep = uploadStep + (hasUploads ? 1 : 0);
  const scheduleStep = claimantStep + (config.claimant ? 1 : 0);

  const schedule = usePickupSchedule({
    processingDays: config.processingDays ?? 0,
    defaultTime: "9:00 AM",
    onChange: () => setMessage(""),
  });

  const slots = isWalkIn
    ? []
    : availableSlots(config.timeSlots, config.code, schedule.selectedDate);

  const requiredFiles = [
    needsValidId && validId,
    needsDocument && requiredDocument,
    ...(config.claimant && someoneElse
      ? [claimant.authorizationLetter, claimant.receiverId]
      : []),
  ].filter((entry) => entry !== false);

  const hasRejectedUpload = requiredFiles.some(
    (file) => file && checkUpload(file)?.ok === false
  );

  function validate() {
    if (hasUploads && requiredFiles.some((file) => !file)) {
      return needsDocument
        ? "Please upload your valid ID and required document."
        : "Please upload your valid ID.";
    }

    if (config.claimant) {
      if (!claimant.claimant) {
        return "Please select who will claim the document.";
      }

      if (someoneElse && !claimant.receiverName.trim()) {
        return "Please complete the receiver details and upload the required documents.";
      }
    }

    // BAU book selection validation
    if (config.code === "BAU" && service === "Books" && !selectedBook) {
      return "Please select a book first.";
    }

    // BAU uniform size validation
    if (config.code === "BAU" && service === "Uniforms") {
      if (!bauDetails.gender) {
        return "Please select Male or Female first.";
      }

      const schoolItems = bauSchoolUniformItems[bauDetails.gender];

      const missingSchoolItems = schoolItems.filter(
        (item) => !bauDetails.schoolSelections[item]
      );

      const missingPeItems = bauPeUniformItems.filter(
        (item) => !bauDetails.peSelections[item]
      );

      if (missingSchoolItems.length || missingPeItems.length) {
        return "Please select a size for every school uniform and PE uniform item.";
      }
    }

    if (!schedule.selectedDate || !schedule.selectedTime) {
      return `Please select a ${kind} date and time.`;
    }

    return "";
  }

  function handleGenerateTicket() {
    const problem = validate();
    setMessage(problem);

    if (!problem) {
      setConfirmOpen(true);
    }
  }

  function handleSubmit() {
    try {
      const appointmentDetails =
        config.code !== "BAU"
          ? null
          : service === "Books"
            ? { type: "book", ...selectedBook }
            : service === "Uniforms"
              ? {
                  type: "uniform",
                  gender: bauDetails.gender,
                  schoolSelections: bauDetails.schoolSelections,
                  peSelections: bauDetails.peSelections,
                }
              : null;

      const appointment = createAppointment({
        config,
        service,
        date: schedule.selectedDate,
        time: schedule.selectedTime,
        receiverName: someoneElse ? claimant.receiverName.trim() : "",
        student: currentStudent,
        details: appointmentDetails,
      });

      window.location.href = `/ticket?id=${encodeURIComponent(
        appointment.id
      )}`;
    } catch (error) {
      if (error.message !== "SLOT_TAKEN") {
        throw error;
      }

      setConfirmOpen(false);
      setSlotTaken({
        date: schedule.selectedDate,
        time: schedule.selectedTime,
      });
      schedule.chooseTime("");
    }
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="srau-main">
        <h1 className="srau-title">{config.title}</h1>

        {config.description && (
          <p className="srau-intro">{config.description}</p>
        )}

        <ServicePicker
          services={config.services}
          value={service}
          onChange={(next) => {
            setService(next);
            setBauDetails(EMPTY_BAU_DETAILS);
            setMessage("");
          }}
          processingDays={config.processingDays ?? 0}
          note={config.serviceNote}
        />

        {config.code === "BAU" && (
          <BAUDetails
            service={service}
            value={bauDetails}
            onChange={(next) => {
              setBauDetails(next);
              setMessage("");
            }}
          />
        )}

        {isWalkIn ? (
          <section className="srau-section">
            <h2>2 · How to get service</h2>
            <div className="srau-fee-note">
              <ol className="srau-steps">
                {config.walkInSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>
        ) : (
          <>
            {hasUploads && (
              <RequirementsUpload
                step={uploadStep}
                help={config.requirements.help}
                validId={validId}
                onValidIdChange={(file) => {
                  setValidId(file);
                  setMessage("");
                }}
                requiredDocument={requiredDocument}
                onRequiredDocumentChange={
                  needsDocument
                    ? (file) => {
                        setRequiredDocument(file);
                        setMessage("");
                      }
                    : undefined
                }
              />
            )}

            {config.claimant && (
              <ClaimantSection
                step={claimantStep}
                value={claimant}
                onChange={(next) => {
                  setClaimant(next);
                  setMessage("");
                }}
              />
            )}

            <PickupScheduler
              schedule={schedule}
              timeSlots={slots}
              step={scheduleStep}
              kind={kind}
              afterProcessing={config.processingDays > 0}
            />

            {message && (
              <p className="srau-message" role="status">
                {message}
              </p>
            )}

            <button
              className="srau-generate-button"
              type="button"
              disabled={hasRejectedUpload}
              onClick={handleGenerateTicket}
            >
              Generate ticket
            </button>

            {hasRejectedUpload && (
              <p className="srau-help">Fix the red upload to continue.</p>
            )}
          </>
        )}

        {config.note && <p className="srau-help srau-note">{config.note}</p>}
      </main>

      {confirmOpen && (
        <Modal
          title="Submit your request?"
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <button
                className="srau-generate-button srau-confirm-button"
                type="button"
                onClick={handleSubmit}
              >
                Yes, submit request
              </button>
              <button
                className="srau-secondary-button"
                type="button"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
            </>
          }
        >
          <p>
            {service} · {config.code}
            <br />
            {currentStudent.name} · {currentStudent.program}
            <br />
            {isPickup ? "Pickup" : "Appointment"}:{" "}
            {formatDate(parseDateKey(schedule.selectedDate))} ·{" "}
            {schedule.selectedTime}

            {service === "Books" && config.code === "BAU" && selectedBook && (
              <>
                <br />
                Book: {selectedBook.title}
                <br />
                Book Code: {selectedBook.code}
                <br />
                Price: ₱{selectedBook.price.toFixed(2)}
              </>
            )}

            {service === "Uniforms" && config.code === "BAU" && (
              <>
                <br />
                Gender: {bauDetails.gender}
                <br />
                School Uniform:{" "}
                {Object.entries(bauDetails.schoolSelections)
                  .map(([item, size]) => `${item}: ${size}`)
                  .join(", ")}
                <br />
                PE Uniform:{" "}
                {Object.entries(bauDetails.peSelections)
                  .map(([item, size]) => `${item}: ${size}`)
                  .join(", ")}
              </>
            )}

            {someoneElse && (
              <>
                <br />
                Receiver: {claimant.receiverName}
              </>
            )}

            <br />
            Fee: {config.feeText}
          </p>
        </Modal>
      )}

      {slotTaken && (
        <Modal
          title="That slot was just taken"
          onClose={() => setSlotTaken(null)}
          actions={
            <button
              className="srau-generate-button"
              type="button"
              onClick={() => setSlotTaken(null)}
            >
              Choose another time
            </button>
          }
        >
          <p>
            {formatDate(parseDateKey(slotTaken.date))} · {slotTaken.time} is
            no longer available. Please choose another time.
          </p>
        </Modal>
      )}
    </div>
  );
}
