import { useState } from "react";
import Modal from "../Modal.jsx";
import Calendar from "../scheduling/Calendar.jsx";
import TimeSlots from "../scheduling/TimeSlots.jsx";
import usePickupSchedule from "../../hooks/usePickupSchedule.js";
import {
  availableSlots,
  rescheduleAppointment,
} from "../../services/appointments.js";
import { formatDate } from "../../utils/dates.js";

// Pick a new date and time for an existing appointment.
export default function RescheduleModal({
  appointment,
  config,
  onClose,
  onSaved,
}) {
  const [message, setMessage] = useState("");

  const schedule = usePickupSchedule({
    processingDays: config.processingDays ?? 0,
    defaultTime: "",
    onChange: () => setMessage(""),
  });

  const slots = availableSlots(
    config.timeSlots,
    config.code,
    schedule.selectedDate,
    appointment.id
  );

  function handleSave() {
    if (!schedule.selectedDate || !schedule.selectedTime) {
      setMessage("Please select a new date and time.");
      return;
    }

    try {
      rescheduleAppointment(
        appointment.id,
        config,
        schedule.selectedDate,
        schedule.selectedTime
      );
      onSaved();
    } catch (error) {
      if (error.message !== "SLOT_TAKEN") {
        throw error;
      }

      setMessage("That slot was just taken. Please choose another time.");
      schedule.chooseTime("");
    }
  }

  return (
    <Modal
      title="Reschedule appointment"
      onClose={onClose}
      actions={
        <>
          <button
            className="srau-generate-button"
            type="button"
            onClick={handleSave}
          >
            Save new schedule
          </button>
          <button
            className="srau-secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
        </>
      }
    >
      <p className="srau-earliest">
        {appointment.service} · {appointment.officeCode}. Earliest:{" "}
        {formatDate(schedule.earliestPickup)}.
      </p>

      <div className="srau-schedule">
        <Calendar schedule={schedule} />
        <TimeSlots schedule={schedule} timeSlots={slots} />
      </div>

      {message && (
        <p className="srau-message" role="status">
          {message}
        </p>
      )}
    </Modal>
  );
}
