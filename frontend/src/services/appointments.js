// Front-end stand-in for the appointments API.
// Appointments are kept in this browser's localStorage so the whole
// student flow (book -> ticket -> my appointments) works before the
// backend exists. When the backend is ready, replace the bodies of these
// functions with fetch() calls and keep the same signatures.

const STORAGE_KEY = "rtu-ccsas.appointments";

// Order shown in the status tracker.
export const STATUS_STEPS = [
  "Submitted",
  "Processing",
  "Ready for pickup",
  "Claimed",
];

const OPEN_STATUSES = ["Submitted", "Processing", "Ready for pickup"];

function readAll() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage can be blocked (private window); the app still renders.
  }
}

export function isUpcoming(appointment) {
  return OPEN_STATUSES.includes(appointment.status);
}

export function listAppointments() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getAppointment(id) {
  return readAll().find((item) => item.id === id) ?? null;
}

function bookedCount(officeCode, date, time, ignoreId) {
  return readAll().filter(
    (item) =>
      item.id !== ignoreId &&
      item.officeCode === officeCode &&
      item.date === date &&
      item.time === time &&
      item.status !== "Cancelled"
  ).length;
}

// Time slots with this browser's own bookings subtracted from "left".
export function availableSlots(timeSlots, officeCode, date, ignoreId) {
  if (!date) {
    return timeSlots;
  }

  return timeSlots.map((slot) => ({
    ...slot,
    left: Math.max(
      0,
      slot.left - bookedCount(officeCode, date, slot.time, ignoreId)
    ),
  }));
}

function slotIsFull(config, date, time, ignoreId) {
  const slot = availableSlots(
    config.timeSlots,
    config.code,
    date,
    ignoreId
  ).find((item) => item.time === time);

  return !slot || slot.left <= 0;
}

// Month-Day-Office-Queue-Service-6-digit code, e.g. 10-19-R-014-TOR-482913
function makeControlNumber(config, service, date, queue) {
  const [, month, day] = date.split("-");
  const serviceCode = config.serviceCodes?.[service] ?? "SVC";
  const code = String(Math.floor(100000 + Math.random() * 900000));

  return `${month}-${day}-${config.officeLetter}-${String(queue).padStart(
    3,
    "0"
  )}-${serviceCode}-${code}`;
}

// Throws Error("SLOT_TAKEN") when the chosen time has no seats left.
export function createAppointment({
  config,
  service,
  date,
  time,
  receiverName = "",
  student,
}) {
  if (slotIsFull(config, date, time)) {
    throw new Error("SLOT_TAKEN");
  }

  const all = readAll();
  const queue =
    all.filter(
      (item) => item.officeCode === config.code && item.date === date
    ).length + 1;

  const appointment = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    controlNumber: makeControlNumber(config, service, date, queue),
    officeCode: config.code,
    officeTitle: config.title,
    officeLetter: config.officeLetter,
    service,
    date,
    time,
    queue,
    receiverName,
    feeText: config.feeText,
    student,
    status: "Submitted",
    createdAt: Date.now(),
  };

  writeAll([...all, appointment]);
  return appointment;
}

function updateAppointment(id, patch) {
  const all = readAll();
  const next = all.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );

  writeAll(next);
  return next.find((item) => item.id === id) ?? null;
}

export function cancelAppointment(id) {
  return updateAppointment(id, { status: "Cancelled" });
}

// Throws Error("SLOT_TAKEN") when the new time has no seats left.
export function rescheduleAppointment(id, config, date, time) {
  if (slotIsFull(config, date, time, id)) {
    throw new Error("SLOT_TAKEN");
  }

  return updateAppointment(id, { date, time });
}
