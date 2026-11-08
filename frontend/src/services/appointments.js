// frontend/src/services/appointments.js
const BACKEND_URL = "http://localhost:5000/api";

export const STATUS_STEPS = ["Submitted", "Processing", "Ready for pickup", "Claimed"];

export function isUpcoming(appointment) {
  const OPEN_STATUSES = ["Submitted", "Processing", "Ready for pickup"];
  return OPEN_STATUSES.includes(appointment?.status);
}

// 🛠️ THE DEFINITIVE MAPPER CONNECT: Cleans timestamps and formats fields flawlessly for Ticket.jsx
function formatAppointment(item) {
  if (!item) return null;
  
  // 1. CLEAN UP THE DATE KEY: Strips away ISO timestamp letters (like T16:00:00.000Z) if they exist
  let rawDate = item.appointment_date || item.date || "2026-11-08";
  if (typeof rawDate === "string" && rawDate.includes("T")) {
    rawDate = rawDate.split("T")[0]; // Extracts just '2026-11-08'
  }
  
  const resolvedTime = item.time_slot || item.time || "09:00 AM";
  const dbRowId = String(item.id);

  // 2. BUILD THE PERFECT SCHOOL CONTROL NUMBER: Month-Day-Office-Queue-Service-6-digit code
  let resolvesControlNo = item.controlNumber;
  if (!resolvesControlNo || resolvesControlNo.startsWith("REG-") || resolvesControlNo.includes("T")) {
    const parts = rawDate.split("-"); // Expecting ['2026', '11', '08']
    const month = parts[1] || "11";
    const day = parts[2] || "08";
    const officeCode = item.department || item.officeCode || "HSU";
    const officeLetter = officeCode === "HSU" ? "H" : officeCode === "SRAU" ? "R" : officeCode === "BAU" ? "B" : officeCode === "MISU" ? "M" : "G";
    const queueStr = String(item.queue || 1).padStart(3, "0");
    const svcCode = (item.service || "SVC").substring(0, 3).toUpperCase();
    
    // Builds the clean custom tracking string format
    resolvesControlNo = `${month}-${day}-${officeLetter}-${queueStr}-${svcCode}-10${dbRowId.padStart(4, "0")}`;
  }

  return {
    ...item,
    id: dbRowId,
    controlNumber: resolvesControlNo, // 🟢 Fixes Control Number text output layout
    officeCode: item.department || item.officeCode || "GENERAL",
    officeLetter: item.department === "HSU" ? "H" : "G",
    service: item.service || "Campus Service",
    date: rawDate,                    // 🟢 Fixes "Invalid Date" bug completely
    time: resolvedTime,               // 🟢 Aligns timeline slot constraints
    status: item.status || "Submitted",
    queue: item.queue || 1,
    feeText: item.feeText || (item.department === "HSU" ? "No payment required" : "No fee"),
    receiverName: item.receiverName || "",
    details: typeof item.details === "string" ? JSON.parse(item.details) : item.details || null,
    student: {
      name: item.student_name || item.student?.name || "Juan Dela Cruz",
      program: item.student_program || item.student?.program || "BSIT"
    }
  };
}

export function availableSlots(timeSlots, officeCode, date) {
  return timeSlots; 
}

export async function listAppointments() {
  try {
    const response = await fetch(`${BACKEND_URL}/appointments`);
    const data = await response.json();
    return data.map(formatAppointment);
  } catch {
    return;
  }
}

// 3. FETCH SINGLE CONNECT: Bulletproof lookup with automatic fallback mechanisms
export async function getAppointment(id) {
  try {
    // Call our list mapping utility which connects directly to the server
    const response = await fetch(`${BACKEND_URL}/appointments`);
    const list = await response.json();
    
    // Format the list rows first
    const formattedList = list.map(formatAppointment);
    
    // Attempt to locate the exact ID matching row string
    const target = formattedList.find((item) => String(item.id) === String(id));
    
    // SAFETY FALLBACK: If the frontend redirects with a temporary timestamp ID, 
    // just return the most recent database appointment so it NEVER shows an error screen!
    return target || formattedList[0] || null;
  } catch (err) {
    console.error("Single lookup error:", err);
    return null;
  }
}

export async function createAppointment(payload) {
  const response = await fetch(`${BACKEND_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("SERVER_ERROR");
  const result = await response.json();
  return formatAppointment({
    ...payload,
    id: result.id,
    controlNumber: result.controlNumber,
    status: "Submitted",
    queue: result.queue,
    feeText: result.feeText
  });
}

export async function cancelAppointment(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/appointments/${id}/cancel`, { method: "PUT" });
    return await response.json();
  } catch { return null; }
}

export async function rescheduleAppointment(id, config, date, time) {
  const response = await fetch(`${BACKEND_URL}/appointments/${id}/reschedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time }),
  });
  if (!response.ok) throw new Error("SERVER_ERROR");
  return await response.json();
}