export const initialAppointments = [
  { id: "10-19-R-014-TOR-482913", short: "…-014-TOR", student: "Juan Dela Cruz", number: "2023-00123", program: "BSIT", service: "Transcript of Records", date: "2026-10-27", time: "9:00 AM", type: "Booked", status: "Processing" },
  { id: "10-19-R-016-CTC-482914", short: "…-016-CTC", student: "Maria Santos", number: "2022-00451", program: "BSCS", service: "CTC / Authentication", date: "2026-10-27", time: "9:30 AM", type: "Booked", status: "Ready for pickup" },
  { id: "WALK-IN-001", short: "—", student: "Pedro Reyes", number: "2024-00088", program: "BSIT", service: "CTC / Authentication", date: "2026-10-27", time: "Walk-in", type: "Walk-in", status: "Served" },
  { id: "10-12-R-011-DIP-482911", short: "…-011-DIP", student: "Ana Lim", number: "2021-00820", program: "BSED", service: "Diploma", date: "2026-10-12", time: "8:30 AM", type: "Booked", status: "No-show" },
  { id: "10-12-R-012-CER-482912", short: "…-012-CER", student: "Ben Cruz", number: "2020-00213", program: "BSBA", service: "Certificates", date: "2026-10-12", time: "8:30 AM", type: "Booked", status: "Claimed" },
];
export const initialServices = [
  { name: "Transcript of Records", available: true, fee: "₱ ___", processing: "5 working days", pickup: true, eligibility: "All students", requirements: "Valid ID · Other documents set by the office", notes: "Bring your control number and valid ID." },
  { name: "Certificates", available: true, fee: "₱ ___", processing: "Set by office", pickup: true, eligibility: "All students", requirements: "Valid ID", notes: "Please check requirements before visiting." },
  { name: "CTC / Authentication", available: true, fee: "₱ ___", processing: "Set by office", pickup: true, eligibility: "All students", requirements: "Valid ID · Original document", notes: "Bring the original document for checking." },
  { name: "Diploma", available: false, fee: "₱ ___", processing: "Set by office", pickup: true, eligibility: "Graduates", requirements: "Valid ID · Clearance", notes: "For graduates only." },
];
export const navItems = ["Dashboard", "Queue", "Requests", "Slots", "Services", "Reports"];
export const times = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "1:00 PM", "1:30 PM"];

// These statuses mean staff have finished handling the appointment/request.
// They stay in the complete appointment history but not in active work lists.
export const HANDLED_STATUSES = new Set([
  "served", "claimed", "done", "no-show", "completed", "cancelled", "canceled",
  "picked up", "picked-up", "collected", "fulfilled", "closed",
]);
export const PENDING_REQUEST_STATUSES = new Set(["submitted", "need processing", "needs processing"]);
const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const isHandled = (item) => HANDLED_STATUSES.has(normalizeStatus(item.status));
const isPendingRequest = (item) => PENDING_REQUEST_STATUSES.has(normalizeStatus(item.status));

