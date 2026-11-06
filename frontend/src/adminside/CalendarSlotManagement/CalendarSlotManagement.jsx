import { useMemo, useState } from "react";
import "./CalendarSlotManagement.css";

const dateText = (value, options) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", options);

export default function CalendarSlotManagement({ slots, setSlots, selectedDate, setSelectedDate, officeName = "Office", note = "Select a date to manage its schedule.", onNotice, getDayStatus }) {
  const [newTime, setNewTime] = useState("08:00");
  const [newCapacity, setNewCapacity] = useState("12");
  const monthStart = useMemo(() => new Date(`${selectedDate.slice(0, 7)}-01T00:00:00`), [selectedDate]);
  const monthDays = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const status = (s) => s.closed ? "Closed" : s.booked >= s.capacity ? "Full" : "Open";
  const pickDate = (value) => { if (value) setSelectedDate(value); };
  const updateMonth = (offset) => {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + offset, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(Math.min(Number(selectedDate.slice(-2)), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())).padStart(2, "0")}`;
    setSelectedDate(next);
  };
  const addSlot = (e) => {
    e.preventDefault();
    const [h, m] = newTime.split(":").map(Number);
    const time = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    if (slots.some((s) => s.time === time)) { onNotice?.("That time slot already exists."); return; }
    setSlots((old) => [...old, { time, capacity: Math.max(1, Number(newCapacity) || 12), booked: 0, closed: false }]);
    onNotice?.(`${time} added to the schedule.`);
  };
  return <section className="calendar-slot-panel">
    <div className="calendar-slot-heading"><div><span className="calendar-slot-eyebrow">{officeName.toUpperCase()} SCHEDULING</span><h2>Slot management</h2><p>{note}</p></div><form className="calendar-slot-add" onSubmit={addSlot}><label>Time<input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required /></label><label>Capacity<input type="number" min="1" max="999" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} required /></label><button type="submit">＋ Add slot</button></form></div>
    <div className="calendar-slot-layout"><aside className="calendar-slot-calendar"><div className="calendar-slot-month"><button type="button" aria-label="Previous month" onClick={() => updateMonth(-1)}>‹</button><strong>{dateText(`${selectedDate.slice(0, 7)}-01`, { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => updateMonth(1)}>›</button></div><div className="calendar-slot-grid">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span className="weekday" key={`${d}-${i}`}>{d}</span>)}{Array.from({ length: monthStart.getDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: monthDays }, (_, i) => { const day = i + 1; const date = `${selectedDate.slice(0, 7)}-${String(day).padStart(2, "0")}`; const dayStatus = getDayStatus?.(date); return <button type="button" key={date} className={date === selectedDate ? "selected" : ""} onClick={() => setSelectedDate(date)} title={dayStatus ? `${dateText(date, { month: "short", day: "numeric" })} · ${dayStatus}` : undefined}>{day}{dayStatus && <i className={`day-dot ${dayStatus}`} />}</button>; })}</div><label className="calendar-slot-date">Selected date<input type="date" value={selectedDate} onChange={(e) => pickDate(e.target.value)} /></label><div className="calendar-slot-legend"><span><i className="open" /> Open</span><span><i className="full" /> Full</span><span><i className="closed" /> Closed</span></div></aside>
    <div className="calendar-slot-details"><div className="calendar-slot-selected-date"><div><span>Managing schedule for</span><h3>{dateText(selectedDate, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</h3></div><div className="calendar-slot-actions"><button type="button" onClick={() => setSlots((old) => old.map((s) => ({ ...s, closed: true })))}>Block selected date</button><button type="button" onClick={() => setSlots((old) => old.map((s) => ({ ...s, closed: false, capacity: s.capacity || 12 })))}>Reopen slots</button></div></div>
    <div className="calendar-slot-summary"><div><strong>{slots.filter((s) => !s.closed && s.booked < s.capacity).length}</strong><span>Open slots</span></div><div><strong>{slots.filter((s) => !s.closed && s.booked >= s.capacity).length}</strong><span>Full slots</span></div><div><strong>{slots.reduce((n, s) => n + (s.closed ? 0 : Math.max(0, s.capacity - s.booked)), 0)}</strong><span>Seats remaining</span></div></div>
    <div className="calendar-slot-table-wrap"><table className="calendar-slot-table"><thead><tr><th>Time</th><th>Capacity</th><th>Booked</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{slots.map((s, i) => <tr key={`${s.time}-${i}`}><td><strong>{s.time}</strong></td><td>{s.closed ? "—" : s.capacity}</td><td>{s.booked}</td><td><span className={`calendar-slot-status ${status(s).toLowerCase()}`}>{status(s)}</span></td><td><div className="calendar-slot-row-actions"><label>Capacity<input aria-label={`Capacity for ${s.time}`} type="number" min={s.booked} max="999" value={s.capacity} onChange={(e) => setSlots((old) => old.map((x, j) => j === i ? { ...x, capacity: Math.max(s.booked, Number(e.target.value) || 0), closed: (Number(e.target.value) || 0) === 0 } : x))} /></label><button type="button" onClick={() => setSlots((old) => old.map((x, j) => j === i ? { ...x, closed: !x.closed, capacity: x.closed && !x.capacity ? 12 : x.capacity } : x))}>{s.closed ? "Open" : "Close"}</button></div></td></tr>)}</tbody></table>{!slots.length && <p className="calendar-slot-empty">No time slots have been added yet.</p>}</div><div className="calendar-slot-footer"><button type="button" onClick={() => setSlots((old) => old.map((s) => ({ ...s, capacity: 12, closed: false })))}>Reset capacities</button><button type="button" onClick={() => setSlots((old) => old.map((s) => ({ ...s, closed: true })))}>Block all slots</button></div></div></div>
  </section>;
}
