export interface DateRange {
  from: Date;
  to: Date;
}

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

  return { from, to };
}

export function timestampToMs(timestamp: any): number | null {
  if (!timestamp) return null;

  if (typeof timestamp === "object" && "_seconds" in timestamp) {
    return timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1_000_000;
  }

  if (typeof timestamp === "string") {
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
