import { dateKey, formatDate, getMonthLabel } from "../../utils/dates.js";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Month grid. Pure display: all state comes from usePickupSchedule.
export default function Calendar({ schedule }) {
  const {
    visibleMonth,
    calendarCells,
    canGoToPreviousMonth,
    selectedDate,
    dateForDay,
    isDayDisabled,
    changeMonth,
    chooseDate,
  } = schedule;

  return (
    <div className="srau-calendar">
      <div className="srau-calendar-header">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canGoToPreviousMonth}
          aria-label="Previous month"
        >
          ‹
        </button>

        <h3>{getMonthLabel(visibleMonth)}</h3>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="srau-weekdays">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="srau-calendar-days">
        {calendarCells.map((day, index) => {
          if (day === null) {
            return (
              <span className="srau-calendar-empty" key={`empty-${index}`} />
            );
          }

          const date = dateForDay(day);
          const isSelected = dateKey(date) === selectedDate;

          return (
            <button
              key={dateKey(date)}
              type="button"
              disabled={isDayDisabled(day)}
              className={isSelected ? "selected" : ""}
              onClick={() => chooseDate(day)}
              aria-pressed={isSelected}
              aria-label={formatDate(date)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
