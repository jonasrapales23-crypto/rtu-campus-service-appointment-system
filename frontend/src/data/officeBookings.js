import { srauConfig } from "./srau.js";

// Student booking settings for every office. SRAU lives in srau.js.
// Fees and exact requirements stay office-defined.
//
// mode:  "pickup"      -> service, uploads, pick a pickup date/time
//        "appointment" -> service, pick an appointment date/time
//        "walkin"      -> service + how-to only (no booking)
export const officeBookings = {
  srau: srauConfig,

  hsu: {
    code: "HSU",
    title: "Health Service Unit (HSU)",
    mode: "appointment",
    officeLetter: "H",
    processingDays: 0,
    feeText: "No payment required",
    serviceNote:
      "No payment is required for HSU services. Eligibility is confirmed by HSU staff.",
    description:
      "Choose a health service and reserve an appointment time. Bring your student ID and any documents the Health Service Unit asks you to provide.",
    note: "Eligibility and final verification are confirmed by HSU staff.",
    services: [
      "Medical Assessment (Freshmen)",
      "Dental Examination (Freshmen)",
      "Medical Consultation",
      "Dental Consultation",
      "Medical Assessment (Internship)",
    ],
    serviceCodes: {
      "Medical Assessment (Freshmen)": "MAF",
      "Dental Examination (Freshmen)": "DEF",
      "Medical Consultation": "MCO",
      "Dental Consultation": "DCO",
      "Medical Assessment (Internship)": "MAI",
    },
    timeSlots: [
      { time: "8:00 AM", left: 4 },
      { time: "8:30 AM", left: 3 },
      { time: "9:00 AM", left: 6 },
      { time: "9:30 AM", left: 2 },
      { time: "10:00 AM", left: 0 },
      { time: "10:30 AM", left: 4 },
      { time: "1:00 PM", left: 5 },
      { time: "1:30 PM", left: 3 },
    ],
  },

  bau: {
    code: "BAU",
    title: "Business Affairs Unit (BAU)",
    mode: "pickup",
    officeLetter: "B",
    processingDays: 0,
    feeText: "₱ ___ (pay at the counter)",
    serviceNote:
      "Fees are paid at the counter. Pickup availability and product stock are confirmed by BAU.",
    description:
      "Select the product or service you need, then choose a pickup schedule. Bring your student ID when you visit the office.",
    note: "BAU accepts bookings up to five working days ahead. Fees, stock availability, and any additional requirements are confirmed by BAU.",
    requirements: {
      validId: true,
      help: "Check with BAU for any product-specific documents before your visit.",
    },
    services: [
      "Books",
      "Uniforms",
      "Sablay",
      "Graduation Pictorial",
      "Concessionaires",
    ],
    serviceCodes: {
      Books: "BKS",
      Uniforms: "UNI",
      Sablay: "SAB",
      "Graduation Pictorial": "GPI",
      Concessionaires: "CON",
    },
    timeSlots: [
      { time: "8:00 AM", left: 12 },
      { time: "9:00 AM", left: 9 },
      { time: "9:30 AM", left: 6 },
      { time: "10:00 AM", left: 0 },
      { time: "10:30 AM", left: 4 },
      { time: "1:00 PM", left: 11 },
      { time: "1:30 PM", left: 8 },
    ],
  },

  misu: {
    code: "MISU",
    title: "Management Information Unit (MISU)",
    mode: "walkin",
    officeLetter: "M",
    serviceNote:
      "MISU serves students as they arrive. No appointment is needed.",
    description:
      "Choose the service you need before visiting the MISU service window.",
    note: "Online appointment scheduling is not used for these services; the office handles the queue at the window.",
    services: ["Registration Form", "Grade Slip", "Other Services"],
    walkInSteps: [
      "Bring your student ID and any information relevant to your request.",
      "Visit the MISU service window during office hours.",
      "Wait to be served in order of arrival.",
    ],
  },
};

export function getOfficeConfig(code) {
  return officeBookings[String(code).toLowerCase()] ?? null;
}
