// SRAU (University Registrar's Office) booking settings.
// Same shape as the other offices in officeBookings.js.
export const srauConfig = {
  code: "SRAU",
  title: "University Registrar's Office (SRAU)",
  mode: "pickup",
  officeLetter: "R",
  processingDays: 5,
  feeText: "₱ ___ (pay at the counter)",
  services: [
    "Transcript of Records",
    "Certificates",
    "CTC / Authentication",
    "Diploma",
  ],
  serviceCodes: {
    "Transcript of Records": "TOR",
    Certificates: "CRT",
    "CTC / Authentication": "CTC",
    Diploma: "DIP",
  },
  // What the student must upload, and whether someone else may claim.
  requirements: { validId: true, requiredDocument: true },
  claimant: true,
  // Demo data until the backend provides real availability per date.
  timeSlots: [
    { time: "8:00 AM", left: 12 },
    { time: "8:30 AM", left: 0 },
    { time: "9:00 AM", left: 9 },
    { time: "9:30 AM", left: 6 },
    { time: "10:00 AM", left: 0 },
    { time: "10:30 AM", left: 4 },
    { time: "1:00 PM", left: 11 },
    { time: "1:30 PM", left: 8 },
  ],
};
