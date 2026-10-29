import { useCallback, useState } from "react";

// Per-date slot schedule shared by the SRAU / HSU / BAU admin pages.
// - `template` is the default schedule every date starts from (time / capacity / closed).
// - Edits (capacity, open/close, add slot, block date...) are stored per date, so changing the
//   working date shows that date's own schedule.
// - `booked` is never stored: it is derived from the appointment rows for that date, so slots
//   always match the appointments (walk-ins don't take a slot).
const key = (time) => String(time ?? "").trim().toUpperCase().replace(/\s+/g, " ");
const minutes = (time) => {
  const m = String(time).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
};
const isCancelled = (row) => /^cancel+ed$/i.test(String(row.status ?? "").trim());

function countBookings(rows, date) {
  const counts = {};
  rows.forEach((row) => {
    if (row.date !== date || row.type === "Walk-in" || isCancelled(row)) return;
    counts[key(row.time)] = (counts[key(row.time)] || 0) + 1;
  });
  return counts;
}

export default function useDailySlots({ template, rows, selectedDate }) {
  const [overrides, setOverrides] = useState({});
  // The original demo figures for the seeded date are kept (minus what the rows already explain),
  // so the first screen looks the same; every other date is driven only by its appointments.
  const [baseline] = useState(() => {
    const counts = countBookings(rows, selectedDate);
    const byTime = {};
    template.forEach((s) => { byTime[key(s.time)] = Math.max(0, (s.booked || 0) - (counts[key(s.time)] || 0)); });
    return { date: selectedDate, byTime };
  });

  const slotsFor = useCallback((date) => {
    const base = overrides[date] ?? template.map(({ time, capacity, closed }) => ({ time, capacity, closed }));
    const counts = countBookings(rows, date);
    return base.map((s) => ({
      ...s,
      booked: (counts[key(s.time)] || 0) + (baseline.date === date ? baseline.byTime[key(s.time)] || 0 : 0),
    }));
  }, [overrides, template, rows, baseline]);

  const slots = slotsFor(selectedDate);

  const setSlots = (updater) => {
    const next = typeof updater === "function" ? updater(slots) : updater;
    const stored = next
      .map(({ time, capacity, closed }) => ({ time, capacity, closed }))
      .sort((a, b) => minutes(a.time) - minutes(b.time));
    setOverrides((old) => ({ ...old, [selectedDate]: stored }));
  };

  // "open" | "full" | "closed" for any date, used for the calendar dots.
  const dayStatus = (date) => {
    const list = slotsFor(date);
    const usable = list.filter((s) => !s.closed && s.capacity > 0);
    if (!usable.length) return "closed";
    return usable.every((s) => s.booked >= s.capacity) ? "full" : "open";
  };

  return { slots, setSlots, dayStatus };
}
