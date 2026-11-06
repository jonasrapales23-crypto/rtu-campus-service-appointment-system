// Pure date helpers shared by every office's booking page.
// All functions work on local dates (no timezone shifts).

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Adds `count` working days (Mon-Fri) to a date. Holidays are not handled yet.
export function addWorkingDays(date, count) {
  const result = startOfDay(date);
  let added = 0;

  while (added < count) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return result;
}


export function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Parses a dateKey back into a local Date.
export function parseDateKey(key) {
  return new Date(`${key}T00:00:00`);
}

export function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
