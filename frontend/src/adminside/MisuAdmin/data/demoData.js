export const initialMisuAppointments = [
  { id: "MISU-033-REG", student: "Pedro Reyes", service: "Registration form", status: "Processing" },
  { id: "MISU-035-REG", student: "Ben Cruz", service: "Registration form", status: "Submitted" },
  { id: "MISU-036-GRD", student: "Maria Santos", service: "Grade slip", status: "Ready for pickup" },
];
export const initialMisuServices = [
  { name: "Registration form", available: true, fee: "Free · ₱150 if lost (reprint)", processing: "1–2 minutes" },
  { name: "Grade slip", available: true, fee: "Free · ₱150 if lost (reprint)", processing: "1–2 minutes" },
  { name: "Other services", available: true, fee: "₱ ___", processing: "Set by office" },
];
