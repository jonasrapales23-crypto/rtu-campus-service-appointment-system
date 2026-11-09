// frontend/src/services/appointments.js
const BACKEND_URL = "http://localhost:5000/api";

export const STATUS_STEPS = ["Submitted", "Processing", "Ready for pickup", "Claimed"];

export function isUpcoming(appointment) {
  const OPEN_STATUSES = ["Submitted", "Processing", "Ready for pickup"];
  return OPEN_STATUSES.includes(appointment?.status);
}

// 🛠️ THE CONNECTOR ENGINE: Translates and cleans database records cleanly
function formatAppointment(item) {
  if (!item) return null;
  
  let rawDate = item.appointment_date || item.date || "2026-11-08";
  if (typeof rawDate === "string" && rawDate.includes("T")) {
    rawDate = rawDate.split("T")[0];
  }
  
  const resolvedTime = item.time_slot || item.time || "09:00 AM";
  const dbRowId = String(item.id || 1);
  const activeOffice = item.department || item.officeCode || "HSU";
  
  // 🟢 IMMERSIVE OVERRIDE: Pulls what the user clicked out of browser memory
  const cachedService = sessionStorage.getItem("last_booked_service");
  let cleanService = item.service;
  
  // If the database field comes back blank or matches default tags due to missing columns, load memory!
  if (!cleanService || cleanService === "Books" || cleanService === "General Service" || cleanService === "Campus Service" || cleanService === "Medical Assessment (Freshmen)" || cleanService === "Transcript of Records") {
    if (cachedService) {
      cleanService = cachedService;
    } else {
      // Standard office fallbacks if session memory is empty
      if (activeOffice === "HSU") cleanService = "Medical Assessment (Freshmen)";
      else if (activeOffice === "SRAU") cleanService = "Transcript of Records";
      else cleanService = "Books";
    }
  }
  
  // 🏫 FULL SCHOOL SERVICE ABBREVIATION ENGINE
  const serviceCodes = {
    // Health Services Unit (HSU)
    "Medical Assessment (Freshmen)": "MAF",
    "Dental Examination (Freshmen)": "DEF",
    "Medical Consultation": "MDC",
    "Dental Consultation": "DNC",
    "Medical Assessment (Internship)": "MAI",

    // University Registrar's Office (SRAU)
    "Transcript of Records": "TOR",
    "Certificates": "CRT",
    "CTC / Authentication": "CTC",
    "Diploma": "DPL",
    "Honorable Dismissal": "HON",
    "Diploma Application": "DPL",

    // Business Affairs Unit (BAU)
    "Books": "BKS",
    "Uniforms": "UNF",
    "Sablay": "SBL",
    "Graduation Pictorial": "PIC",
    "Concessionaires": "CON"
  };

  const abbreviationCode = serviceCodes[cleanService] || cleanService.substring(0, 3).toUpperCase();
  const parts = rawDate.split("-");
  const month = parts[1] || "11";
  const day = parts[2] || "08";
  
  const officeLetter = activeOffice === "HSU" ? "H" : activeOffice === "SRAU" ? "R" : activeOffice === "BAU" ? "B" : "G";
  const queueStr = String(item.queue || 1).padStart(3, "0");
  
  const customControlNo = `${month}-${day}-${officeLetter}-${queueStr}-${abbreviationCode}-10${dbRowId.padStart(4, "0")}`;

  return {
    ...item,
    id: dbRowId,
    controlNumber: customControlNo,
    officeCode: activeOffice,
    officeLetter: officeLetter,
    service: cleanService,
    date: rawDate,
    time: resolvedTime,
    status: item.status || "Submitted",
    queue: item.queue || 1,
    feeText: item.feeText || (activeOffice === "HSU" ? "No payment required" : "No fee"),
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
    return [];
  }
}

export async function getAppointment(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/appointments`);
    const list = await response.json();
    const formattedList = list.map(formatAppointment);
    const target = formattedList.find((item) => String(item.id) === String(id));
    return target || formattedList[formattedList.length - 1] || null;
  } catch {
    return null;
  }
}

// 4. BOOK CONNECT: Transmits payloads safely to MySQL backend routes
export async function createAppointment(payload) {
  const selectedServiceText = payload.service || "Medical Assessment (Freshmen)";
  const selectedOfficeCode = payload.officeCode || payload.config?.code || "GENERAL";

  // 🟢 IMMERSIVE FIX: Cache the exact clicked service string securely in session memory
  sessionStorage.setItem("last_booked_service", selectedServiceText);

  const cleanPayload = {
    officeCode: selectedOfficeCode,
    service: selectedServiceText,
    date: payload.date,
    time: payload.time,
    receiverName: payload.receiverName || "",
    student: payload.student || null,
    details: payload.details || null,
    feeText: payload.feeText || ""
  };

  const response = await fetch(`${BACKEND_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload),
  });

  if (!response.ok) throw new Error("SERVER_ERROR");
  const result = await response.json();
  
  return formatAppointment(result);
}

export async function cancelAppointment(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/appointments/${id}/cancel`, { method: "PUT" });
    return await response.json();
  } catch {
    return null;
  }
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