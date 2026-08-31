/**
 * Date helpers for festival data.
 *
 * All festival dates are date-only strings (`YYYY-MM-DD`). `new Date("2026-07-03")`
 * parses those as UTC midnight, so reading them back with local getters
 * (`getDate()`, `getMonth()`) shifts the day for every visitor west of UTC —
 * which silently mis-buckets month-boundary festivals. Everything in this file
 * works on local midnight instead. Never call `new Date(iso)` on festival dates.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Parse a `YYYY-MM-DD` (or longer ISO) string as **local** midnight.
 * Returns null for anything that is not a real calendar date, so callers
 * can never end up holding an `Invalid Date`.
 */
export function parseLocalDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = DATE_ONLY.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Rejects 2026-02-30 and friends, which JS would otherwise roll forward.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** `YYYY-MM-DD` for a Date, using its local calendar fields. */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight today — the reference point for "is this festival over?". */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Calendar year of a festival date, or null when unparseable. */
export function yearOf(iso: string): number | null {
  return parseLocalDate(iso)?.getFullYear() ?? null;
}

/** Zero-based month of a festival date, or null when unparseable. */
export function monthOf(iso: string): number | null {
  return parseLocalDate(iso)?.getMonth() ?? null;
}

/**
 * `YYYY-MM` bucket key. Year-qualified on purpose: grouping by month alone
 * merges July 2026 with July 2027 as soon as a second season is loaded.
 */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/** Whole days from `start` to `end` (0 for a single-day festival). */
export function daysBetween(startIso: string, endIso: string): number {
  const start = parseLocalDate(startIso);
  const end = parseLocalDate(endIso);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** e.g. `Jul 3-5, 2026` / `Jul 30 - Aug 2, 2026`. Empty string for bad input. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseLocalDate(startIso);
  const end = parseLocalDate(endIso);
  if (!start) return '';
  if (!end) {
    return `${MONTH_ABBR[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }

  const startMonth = MONTH_ABBR[start.getMonth()];
  const endMonth = MONTH_ABBR[end.getMonth()];
  const year = start.getFullYear();

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} ${start.getDate()}, ${year} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (startMonth === endMonth) {
    if (start.getDate() === end.getDate()) {
      return `${startMonth} ${start.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

/** `Jul 3` — for dense timeline labels. */
export function formatMonthDay(iso: string): string {
  const date = parseLocalDate(iso);
  if (!date) return '';
  return `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}`;
}

/** Human date for freshness lines: `9 Mar 2026`. */
export function formatUpdatedAt(value: string | null): string | null {
  const date = parseLocalDate(value);
  if (!date) return null;
  return `${date.getDate()} ${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

/** `2026` or `2026-2027` — for year-neutral copy that still tells the truth. */
export function formatYearRange(years: number[]): string {
  if (years.length === 0) return '';
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? `${first}` : `${first}-${last}`;
}
