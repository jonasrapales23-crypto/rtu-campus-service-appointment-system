import { officeBookings } from "./officeBookings.js";

// Flat list of every bookable service, used by the search page.
// Extra words that should also find a service.
const ALIASES = {
  "Transcript of Records": ["tor", "transcript", "records"],
  Certificates: ["certificate", "cert"],
  "CTC / Authentication": ["ctc", "certified true copy", "authentication"],
  Diploma: ["diploma", "graduate"],
  "Dental Examination (Freshmen)": ["dental", "teeth", "exam"],
  "Dental Consultation": ["dental", "teeth"],
  "Medical Consultation": ["medical", "doctor", "clinic"],
  "Medical Assessment (Freshmen)": ["medical", "assessment", "checkup"],
  "Medical Assessment (Internship)": ["medical", "assessment", "ojt"],
  Uniforms: ["uniform"],
  Books: ["book"],
  Sablay: ["sablay", "toga"],
  "Registration Form": ["registration", "cor", "form"],
  "Grade Slip": ["grades", "grade"],
};

function eligibilityFor(name) {
  if (/\(freshmen\)/i.test(name)) return "Eligibility: freshmen";
  if (/\(internship\)/i.test(name)) return "Eligibility: internship students";
  return "Eligibility: as stated by HSU";
}

function requirementsFor(office, name) {
  if (office.code === "HSU") return eligibilityFor(name);
  if (office.mode === "walkin") return "Walk-in, no booking";
  if (office.code === "SRAU") return "valid ID and office-set documents";
  return "valid ID";
}

export const serviceCatalog = Object.values(officeBookings).flatMap(
  (office) =>
    office.services.map((name) => ({
      name,
      officeCode: office.code,
      mode: office.mode,
      path: `/${office.code.toLowerCase()}`,
      requirements: requirementsFor(office, name),
      fee:
        office.code === "HSU"
          ? "No payment"
          : office.mode === "walkin"
            ? ""
            : "Fee ₱ ___",
      processing: office.processingDays
        ? `${office.processingDays} working days`
        : "",
      keywords: [
        name,
        office.code,
        office.title,
        ...(ALIASES[name] ?? []),
      ]
        .join(" ")
        .toLowerCase(),
    }))
);

// Returns matching services, best match first.
export function searchServices(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  return serviceCatalog
    .map((item) => {
      const name = item.name.toLowerCase();
      const score = words.reduce((total, word) => {
        if (name.includes(word)) return total + 3;
        if (item.keywords.includes(word)) return total + 1;
        return total;
      }, 0);

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
