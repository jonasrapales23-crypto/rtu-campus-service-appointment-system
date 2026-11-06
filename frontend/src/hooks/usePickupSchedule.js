import { useState } from "react";
import {
  addWorkingDays,
  dateKey,
  startOfDay,
  startOfMonth,
} from "../utils/dates.js";

// All state and rules for picking a pickup date + time.
// Used by the SRAU page now; HSU / BAU can reuse it as-is.
//
// options.processingDays  working days before the earliest pickup
// options.defaultTime     preselected time slot ("" for none)
// options.onChange        called whenever the student picks a date or time
export default function usePickupSchedule({
  processingDays = 5,
  defaultTime = "",
  onChange,
} = {}) {
  const [earliestPickup] = useState(() =>
    addWorkingDays(startOfDay(new Date()), processingDays)
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    dateKey(earliestPickup)
  );
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(earliestPickup)
  );

  const minimumMonth = startOfMonth(earliestPickup);
  const canGoToPreviousMonth =
    visibleMonth.getTime() > minimumMonth.getTime();

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // null = empty cell before the 1st of the month.
  const calendarCells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function dateForDay(day) {
    return new Date(year, month, day);
  }

  function isDayDisabled(day) {
    return dateForDay(day) < earliestPickup;
  }

  function changeMonth(amount) {
    setVisibleMonth((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1
      );

      return next < minimumMonth ? minimumMonth : next;
    });
  }

  function chooseDate(day) {
    if (isDayDisabled(day)) {
      return;
    }

    setSelectedDate(dateKey(dateForDay(day)));
    onChange?.();
  }

  function chooseTime(time) {
    setSelectedTime(time);
    onChange?.();
  }

  return {
    earliestPickup,
    selectedDate,
    selectedTime,
    visibleMonth,
    calendarCells,
    canGoToPreviousMonth,
    dateForDay,
    isDayDisabled,
    changeMonth,
    chooseDate,
    chooseTime,
  };
}
