// SRAU (Registrar) configuration. Other offices get their own file.
export const srauConfig = {
  title: "University Registrar's Office (SRAU)",
  processingDays: 5,
  services: [
    "Transcript of Records",
    "Certificates",
    "CTC / Authentication",
    "Diploma",
  ],
  // Demo data until the backend provides real availability per date.
  timeSlots: [
    { time: "8:00 AM", left: 12 },
    { time: "9:00 AM", left: 9 },
    { time: "9:30 AM", left: 6 },
    { time: "10:00 AM", left: 0 },
    { time: "10:30 AM", left: 4 },
    { time: "1:00 PM", left: 11 },
    { time: "1:30 PM", left: 8 },
  ],
};
