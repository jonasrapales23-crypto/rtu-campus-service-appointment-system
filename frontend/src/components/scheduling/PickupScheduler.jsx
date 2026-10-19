import Calendar from "./Calendar.jsx";
import TimeSlots from "./TimeSlots.jsx";
import { formatDate } from "../../utils/dates.js";

// Step "Pick a pickup date and time": calendar + time slots together.
export default function PickupScheduler({ schedule, timeSlots }) {
  return (
    <section className="srau-section">
      <h2>4 · Pick a pickup date and time</h2>

      <p className="srau-earliest">
        Earliest pickup: {formatDate(schedule.earliestPickup)} (after
        processing).
      </p>

      <div className="srau-schedule">
        <Calendar schedule={schedule} />
        <TimeSlots schedule={schedule} timeSlots={timeSlots} />
      </div>
    </section>
  );
}
