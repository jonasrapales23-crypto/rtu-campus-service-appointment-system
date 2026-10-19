import { useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import ServicePicker from "../../components/forms/ServicePicker.jsx";
import RequirementsUpload from "../../components/forms/RequirementsUpload.jsx";
import ClaimantSection from "../../components/forms/ClaimantSection.jsx";
import PickupScheduler from "../../components/scheduling/PickupScheduler.jsx";
import usePickupSchedule from "../../hooks/usePickupSchedule.js";
import { srauConfig } from "../../data/srau.js";
import "../../styles/Login.css";
import "../../styles/Srau.css";

export default function Srau() {
  const [service, setService] = useState(srauConfig.services[0]);
  const [validId, setValidId] = useState(null);
  const [requiredDocument, setRequiredDocument] = useState(null);
  const [claimant, setClaimant] = useState({
    claimant: "",
    authorizationLetter: null,
    receiverId: null,
    receiverName: "",
  });
  const [message, setMessage] = useState("");

  const schedule = usePickupSchedule({
    processingDays: srauConfig.processingDays,
    defaultTime: "9:00 AM",
    onChange: () => setMessage(""),
  });

  function handleGenerateTicket() {
    setMessage("");

    if (!validId || !requiredDocument) {
      setMessage("Please upload your valid ID and required document.");
      return;
    }

    if (claimant.claimant === "someone-else") {
      if (
        !claimant.authorizationLetter ||
        !claimant.receiverId ||
        !claimant.receiverName.trim()
      ) {
        setMessage(
          "Please complete the receiver details and upload the required documents."
        );
        return;
      }
    }

    if (!schedule.selectedDate || !schedule.selectedTime) {
      setMessage("Please select a pickup date and time.");
      return;
    }

    setMessage(
      "Your selections are ready. Ticket generation will be available when the backend is connected."
    );
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="srau-main">
        <h1 className="srau-title">{srauConfig.title}</h1>

        <ServicePicker
          services={srauConfig.services}
          value={service}
          onChange={setService}
          processingDays={srauConfig.processingDays}
        />

        <RequirementsUpload
          validId={validId}
          onValidIdChange={setValidId}
          requiredDocument={requiredDocument}
          onRequiredDocumentChange={setRequiredDocument}
        />

        <ClaimantSection value={claimant} onChange={setClaimant} />

        <PickupScheduler
          schedule={schedule}
          timeSlots={srauConfig.timeSlots}
        />

        {message && (
          <p className="srau-message" role="status">
            {message}
          </p>
        )}

        <button
          className="srau-generate-button"
          type="button"
          onClick={handleGenerateTicket}
        >
          Generate ticket
        </button>
      </main>
    </div>
  );
}
