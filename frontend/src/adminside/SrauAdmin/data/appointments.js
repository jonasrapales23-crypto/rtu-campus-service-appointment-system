export const initialAppointments = [
  { id: "10-27-R-014-TOR-482913", short: "…-014-TOR", student: "Juan Dela Cruz", number: "2023-00123", program: "BSIT", service: "Transcript of Records", date: "2026-10-27", time: "9:00 AM", type: "Booked", status: "Processing" },
  { id: "10-27-R-016-CTC-482914", short: "…-016-CTC", student: "Maria Santos", number: "2022-00451", program: "BSCS", service: "CTC / Authentication", date: "2026-10-27", time: "9:30 AM", type: "Booked", status: "Ready for pickup" },
  { id: "10-27-R-017-CER-482915", short: "…-017-CER", student: "Angela Mendoza", number: "2024-00214", program: "BSBA", service: "Certificates", date: "2026-10-27", time: "10:00 AM", type: "Booked", status: "Submitted" },
  { id: "10-27-R-018-DIP-482916", short: "…-018-DIP", student: "Miguel Ramos", number: "2021-00602", program: "BSED", service: "Diploma", date: "2026-10-27", time: "10:30 AM", type: "Booked", status: "Needs processing" },
  { id: "10-27-R-019-TOR-482917", short: "…-019-TOR", student: "Sofia Garcia", number: "2022-00741", program: "BSIT", service: "Transcript of Records", date: "2026-10-27", time: "11:00 AM", type: "Booked", status: "Processing" },
  { id: "10-27-R-020-CTC-482918", short: "…-020-CTC", student: "Daniel Flores", number: "2023-00531", program: "BSCS", service: "CTC / Authentication", date: "2026-10-27", time: "1:00 PM", type: "Booked", status: "Needs processing" },
  { id: "10-27-R-021-CER-482919", short: "…-021-CER", student: "Isabella Cruz", number: "2020-00318", program: "BSBA", service: "Certificates", date: "2026-10-27", time: "1:30 PM", type: "Booked", status: "Ready for pickup" },
  { id: "10-27-R-022-TOR-482920", short: "…-022-TOR", student: "Gabriel Bautista", number: "2021-00199", program: "BSIT", service: "Transcript of Records", date: "2026-10-27", time: "2:00 PM", type: "Booked", status: "Submitted" },
  { id: "10-27-R-023-DIP-482921", short: "…-023-DIP", student: "Patricia Villanueva", number: "2019-00817", program: "BSED", service: "Diploma", date: "2026-10-27", time: "2:30 PM", type: "Booked", status: "Processing" },
  { id: "10-27-R-024-CTC-482922", short: "…-024-CTC", student: "Rafael Aquino", number: "2024-00175", program: "BSCS", service: "CTC / Authentication", date: "2026-10-27", time: "3:00 PM", type: "Booked", status: "Needs processing" },
  { id: "WALK-IN-001", short: "—", student: "Pedro Reyes", number: "2024-00088", program: "BSIT", service: "CTC / Authentication", date: "2026-10-27", time: "Walk-in", type: "Walk-in", status: "Served" },
  { id: "10-27-R-025-CER-482923", short: "…-025-CER", student: "Camila Torres", number: "2020-00409", program: "BSBA", service: "Certificates", date: "2026-10-27", time: "3:30 PM", type: "Booked", status: "Claimed" },
  { id: "10-26-R-011-DIP-482911", short: "…-011-DIP", student: "Ana Lim", number: "2021-00820", program: "BSED", service: "Diploma", date: "2026-10-26", time: "8:30 AM", type: "Booked", status: "No-show" },
  { id: "10-26-R-012-CER-482912", short: "…-012-CER", student: "Ben Cruz", number: "2020-00213", program: "BSBA", service: "Certificates", date: "2026-10-26", time: "8:30 AM", type: "Booked", status: "Done" },
];
export const initialServices = [
  { name: "Transcript of Records", available: true, fee: "₱350 (college) · +₱30 doc stamp each", processing: "7 working days", pickup: true, eligibility: "All students", requirements: "Valid ID · Accomplished clearance · Official receipt", notes: "Bring your control number and valid ID." },
  { name: "Certificates", available: true, fee: "₱150 (Completion ₱200)", processing: "3–7 working days", pickup: true, eligibility: "All students", requirements: "Valid ID", notes: "Please check requirements before visiting." },
  { name: "CTC / Authentication", available: true, fee: "₱150", processing: "Set by office", pickup: true, eligibility: "All students", requirements: "Valid ID · Original document", notes: "Bring the original document for checking." },
  { name: "Diploma", available: true, fee: "₱500", processing: "Set by office", pickup: true, eligibility: "All students", requirements: "Valid ID · Accomplished clearance", notes: "Bring your control number and valid ID." },
];
export const navItems = ["Dashboard", "Queue", "Requests", "Slots", "Services", "Reports"];
export const times = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"];

// These statuses mean staff have finished handling the appointment/request.
// They stay in the complete appointment history but not in active work lists.
export const HANDLED_STATUSES = new Set([
  "served", "claimed", "done", "no-show", "completed", "cancelled", "canceled",
  "picked up", "picked-up", "collected", "fulfilled", "closed",
]);
export const PENDING_REQUEST_STATUSES = new Set(["submitted", "needs processing"]);
const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const isHandled = (item) => HANDLED_STATUSES.has(normalizeStatus(item.status));
const isPendingRequest = (item) => PENDING_REQUEST_STATUSES.has(normalizeStatus(item.status));

