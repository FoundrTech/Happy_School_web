/**
 * Academic year utilities.
 * An academic year runs from June 1 of the start year to May 31 of the end year.
 * Label format: "2024-25"
 */

/** Returns the current academic year label, e.g. "2026-27". */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  if (month >= 6) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/**
 * Returns all academic year labels from startYear up to (and including)
 * the current academic year, in ascending order.
 */
export function getAcademicYears(startYear = 2022): string[] {
  const current = getCurrentAcademicYear();
  const currentStartYear = parseInt(current.split("-")[0], 10);
  const years: string[] = [];

  for (let y = startYear; y <= currentStartYear; y++) {
    years.push(`${y}-${String(y + 1).slice(2)}`);
  }

  return years;
}
