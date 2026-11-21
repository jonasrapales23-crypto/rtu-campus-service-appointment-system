// frontend/src/services/appointments.js
const BACKEND_URL = "http://localhost:5000/api";

export const STATUS_STEPS = ["Submitted", "Processing", "Ready for pickup", "Claimed"];

export function isUpcoming(appointment) {
  const OPEN_STATUSES = ["Submitted", "Processing", "Ready for pickup"];
  return OPEN_STATUSES.includes(appointment?.status);
}

function formatAppointment(item) {
  if (!item) return null;

  let rawDate = "2026-11-17";
  if (item.appointment_date || item.date) {
    const fallbackDate = item.appointment_date || item.date;
    if (typeof fallbackDate === "string") {
      rawDate = fallbackDate.split("T")[0];
    } else if (fallbackDate instanceof Date && !isNaN(fallbackDate.getTime())) {
      const y = fallbackDate.getFullYear();
      const m = String(fallbackDate.getMonth() + 1).padStart(2, "0");
      const d = String(fallbackDate.getDate()).padStart(2, "0");
      rawDate = `${y}-${m}-${d}`;
    }
  }

  const resolvedTime = item.time_slot || item.time || "09:00 AM";
  const dbRowId = String(item.id || 1);
  const activeOffice = item.department || item.officeCode || "HSU";

  const cachedService = sessionStorage.getItem("last_booked_service");
  let cleanService = item.service;

  if (!cleanService || cleanService === "Books" || cleanService === "General Service" || cleanService === "Campus Service") {
    cleanService = cachedService || (activeOffice === "HSU" ? "Medical Assessment (Freshmen)" : activeOffice === "SRAU" ? "Transcript of Records" : "Books");
  }

  const serviceCodes = {
    "Medical Assessment (Freshmen)": "MAF",
    "Medical Assessment for Freshmen": "MAF",
    "Dental Examination (Freshmen)": "DEF",
    "Dental Examination for Freshmen": "DEF",
    "Medical Consultation": "MDC",
    "Dental Consultation": "DNC",
    "Medical Assessment (Internship)": "MAI",
    "Transcript of Records": "TOR",
    "Certificates": "CRT",
    "CTC / Authentication": "CTC",
    "Diploma": "DPL",
    "Books": "BKS",
    "Uniforms": "UNF",
    "Sablay": "SBL",
    "Graduation Pictorial": "PIC",
    "Receipt": "RCP",
    "Grade Slip": "GRD",
    "Registration Form": "REG",
    "Student ID": "SID"
  };

  const abbreviationCode = serviceCodes[cleanService] || cleanService.substring(0, 3).toUpperCase();
  const parts = String(rawDate).split("-");
  const month = parts[1] || "11";
  const day = parts[2] || "17";

  const officeLetter = activeOffice === "HSU" ? "H" : activeOffice === "SRAU" ? "R" : activeOffice === "BAU" ? "B" : activeOffice === "MISU" ? "M" : "G";
  const queueStr = String(item.queue || 1).padStart(3, "0");
  const customControlNo = `${month}-${day}-${officeLetter}-${queueStr}-${abbreviationCode}-10${dbRowId.padStart(4, "0")}`;

  // Normalize case-sensitivity values for student view tracker bubble
  const currentStatus = String(item.status || "").toLowerCase().trim();
  const normalizedStatus = (currentStatus === "served" || currentStatus === "claimed") ? "Claimed" : 
                           currentStatus === "processing" ? "Processing" :
                           currentStatus === "ready for pickup" ? "Ready for pickup" :
                           currentStatus === "cancelled" ? "Cancelled" :
                           currentStatus === "no-show" ? "No-show" : "Submitted";

  return {
    ...item,
    id: dbRowId,
    controlNumber: customControlNo,
    officeCode: activeOffice,
    officeLetter: officeLetter,
    service: cleanService,
    date: rawDate,
    time: resolvedTime,
    status: normalizedStatus,
    queue: item.queue || 1,
    feeText: item.feeText || (activeOffice === "HSU" ? "No payment required" : "No fee"),
    receiverName: item.receiverName || "",
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
    if (!response.ok || !Array.isArray(data)) return [];
    return data.map(formatAppointment);
  } catch {
    return [];
  }
}

export async function getAppointment(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/appointments`);
    const list = await response.json();
    if (!response.ok || !Array.isArray(list)) return null;
    const formattedList = list.map(formatAppointment);
    return formattedList.find((item) => String(item.id) === String(id)) || null;
  } catch {
    return null;
  }
}
export async function createAppointment(payload) {
  const selectedServiceText = payload.service || "Medical Assessment (Freshmen)";
  const selectedOfficeCode = payload.officeCode || payload.config?.code || "GENERAL";

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

// ==========================================
// ADMIN SERVICE HELPERS
// ==========================================

export async function fetchAdminAppointments(targetOffice = null) {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/appointments`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) return [];

    return data
      .filter((row) => !targetOffice || String(row.officeCode).toUpperCase() === targetOffice.toUpperCase())
      .map((row) => {
        let cleanDate = new Date().toISOString().slice(0, 10);
        if (row.date) {
          const parsed = new Date(row.date);
          if (!Number.isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, "0");
            const d = String(parsed.getDate()).padStart(2, "0");
            cleanDate = `${y}-${m}-${d}`;
          } else if (typeof row.date === "string") {
            cleanDate = row.date.slice(0, 10);
          }
        }

        const office = String(row.officeCode || "HSU").toUpperCase();
        const cachedService = sessionStorage.getItem("last_booked_service");

        let cleanService = row.service || cachedService;
        if (!cleanService) {
          if (office === "HSU") cleanService = "Medical Assessment (Freshmen)";
          else if (office === "SRAU") cleanService = "Transcript of Records";
          else if (office === "BAU") cleanService = "Books";
          else cleanService = "Registration form";
        }

        const parts = cleanDate.split("-");
        const month = parts[1] || "11";
        const day = parts[2] || "17";
        const officeLetter = office === "HSU" ? "H" : office === "SRAU" ? "R" : office === "BAU" ? "B" : "M";
        const svcCode = cleanService.substring(0, 3).toUpperCase();
        
        // Use clean numeric ID strings safely mapped to resolve update target anomalies
        const displayId = row.controlNumber || `${month}-${day}-${officeLetter}-001-${svcCode}-10${String(row.id).padStart(4, "0")}`;
        const shortId = `…-${displayId.slice(-10)}`;

        // Normalize case-sensitivity values for administrative tables badges
        const currentStatus = String(row.status || "").toLowerCase().trim();
        const adminStatus = (currentStatus === "claimed" || currentStatus === "served") ? "Served" :
                            currentStatus === "processing" ? "Processing" :
                            currentStatus === "ready for pickup" ? "Ready for pickup" :
                            currentStatus === "cancelled" ? "Cancelled" :
                            currentStatus === "no-show" ? "No-show" : "Submitted";

        return {
          dbId: row.id,
          id: displayId,
          short: shortId,
          student: row.student || "Juan Dela Cruz",
          number: row.number || "2023-00123",
          program: row.program || "BSIT",
          service: cleanService,
          product: cleanService,
          date: cleanDate,
          time: row.time || "09:00 AM",
          type: row.time === "Walk-in" ? "Walk-in" : "Booked",
          status: adminStatus,
          receiver: row.receiverName || row.student || "Juan Dela Cruz",
        };
      });
  } catch (err) {
    console.error("Failed to fetch admin appointments:", err);
    return [];
  }
}

export async function updateAdminStatus(dbId, status, adminName) {
  try {
    const cleanId = String(dbId).includes("-") ? String(dbId).split("-").pop().replace(/\D/g, "") : dbId;

    const response = await fetch(`${BACKEND_URL}/admin/appointments/${cleanId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminName }),
    });
    return await response.json();
  } catch (err) {
    console.error("Failed to update status:", err);
    return null;
  }
}

export async function fetchAuditLogs() {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/audit-logs`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) return [];
    return data.map((log) => {
      const dateObj = log.created_at ? new Date(log.created_at) : new Date();
      const timeStr = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return {
        time: timeStr,
        user: log.user || "System",
        action: log.details || log.action,
      };
    });
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}