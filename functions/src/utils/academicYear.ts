/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Parses "2024-25" or "2024-2025" into a date range.
 * Academic year: June 1 of start year → May 31 of end year.
 */
export function getAcademicYearRange(academicYear: string): DateRange | null {
  const match = academicYear.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) return null;

  const startYear = parseInt(match[1], 10);
  const suffix = match[2];
  const endYear = suffix.length === 2
    ? Math.floor(startYear / 100) * 100 + parseInt(suffix, 10)
    : parseInt(suffix, 10);

  const from = new Date(startYear, 5, 1, 0, 0, 0, 0);       // June 1
  const to = new Date(endYear, 4, 31, 23, 59, 59, 999);      // May 31

  return {from, to};
}

/**
 * Converts any timestamp format to milliseconds.
 * Handles Firestore {_seconds, _nanoseconds}, strings, and numbers.
 */
export function timestampToMs(timestamp: any): number | null {
  if (!timestamp) return null;

  if (typeof timestamp === "object" && "_seconds" in timestamp) {
    return timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1_000_000;
  }

  if (typeof timestamp === "string") {
    // Try "DD/MM/YYYY, hh:mm A" format
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(timestamp);
    if (ddmmyyyy) {
      const iso = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}${timestamp.slice(10)}`;
      const ms = new Date(iso).getTime();
      if (!isNaN(ms)) return ms;
    }
    const ms = new Date(timestamp).getTime();
    return isNaN(ms) ? null : ms;
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }

  return null;
}

/**
 * Converts short format "2024-25" to long format "2024-2025" used in Firestore yearlyReports.
 * Passes through if already in long format.
 */
export function shortToLongAcademicYear(year: string): string {
  const match = year.match(/^(\d{4})-(\d{2})$/);
  if (!match) return year;
  const startYear = parseInt(match[1], 10);
  const endYear = Math.floor(startYear / 100) * 100 + parseInt(match[2], 10);
  return `${startYear}-${endYear}`;
}

/**
 * Filters an array of items by academic year using a timestamp field.
 */
export function filterByAcademicYear<T>(
  items: T[],
  academicYear: string,
  getTimestamp: (item: T) => any
): T[] {
  const range = getAcademicYearRange(academicYear);
  if (!range) return items;

  return items.filter((item) => {
    const ms = timestampToMs(getTimestamp(item));
    if (ms === null) return false;
    return ms >= range.from.getTime() && ms <= range.to.getTime();
  });
}
