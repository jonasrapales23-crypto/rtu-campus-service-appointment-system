import { formatDate, parseDateKey } from "../../utils/dates.js";

// Selected date heading + the list of time slots for it.
export default function TimeSlots({ schedule, timeSlots }) {
  const { selectedDate, selectedTime, chooseTime } = schedule;

  return (
    <div className="srau-time-panel">
      <p className="srau-selected-date">
        {selectedDate
          ? formatDate(parseDateKey(selectedDate))
          : "Choose a pickup date"}
      </p>

      <div className="srau-time-slots">
        {timeSlots.map((slot) => {
          const unavailable = slot.left === 0;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={unavailable || !selectedDate}
              className={selectedTime === slot.time ? "selected" : ""}
              onClick={() => chooseTime(slot.time)}
            >
              <span>{slot.time}</span>
              <span>{unavailable ? "Full" : `${slot.left} left`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
