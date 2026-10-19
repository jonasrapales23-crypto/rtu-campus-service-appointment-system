// Offices shown on the home page. Later this can come from the backend.
export const offices = [
  {
    code: "HSU",
    name: "Health Service Unit",
    services: "Medical assessment, dental exam, consultations",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
    path: "/hsu",
  },
  {
    code: "SRAU",
    name: "University Registrar's Office",
    services: "TOR, certificates, CTC, diploma",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
    path: "/srau",
  },
  {
    code: "MISU",
    name: "Management Information Unit",
    services: "Registration form, grade slip, other services",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Served as students arrive",
    showBooking: false,
    path: "/misu",
  },
  {
    code: "BAU",
    name: "Business Affairs Unit",
    services:
      "Uniforms, books, Sablay, graduation pictorial, concessionaires",
    status: "Open today · 8:00 AM–5:00 PM",
    booking: "Book up to 5 working days ahead",
    showBooking: true,
    path: "/bau",
  },
];
