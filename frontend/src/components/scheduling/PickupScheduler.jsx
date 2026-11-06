import Calendar from "./Calendar.jsx";
import TimeSlots from "./TimeSlots.jsx";
import { formatDate } from "../../utils/dates.js";

// Step "Pick a pickup date and time": calendar + time slots together.
// Defaults match SRAU; other offices pass `step`, `kind` and `afterProcessing`.
export default function PickupScheduler({
  schedule,
  timeSlots,
  step = 4,
  kind = "pickup",
  afterProcessing = true,
}) {
  return (
    <section className="srau-section">
      <h2>
        {step} · Pick a {kind} date and time
      </h2>

      <p className="srau-earliest">
        Earliest {kind}: {formatDate(schedule.earliestPickup)}
        {afterProcessing ? " (after processing)." : "."}
      </p>

      <div className="srau-schedule">
        <Calendar schedule={schedule} />
        <TimeSlots schedule={schedule} timeSlots={timeSlots} />
      </div>
    </section>
  );
}
