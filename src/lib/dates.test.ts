import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  formatDateRange,
  formatUpdatedAt,
  formatYearRange,
  monthKey,
  monthOf,
  parseLocalDate,
  startOfToday,
  toDateString,
  yearOf,
} from './dates';

describe('parseLocalDate', () => {
  it('reads a date-only string as local midnight, not UTC', () => {
    const date = parseLocalDate('2026-07-03');
    expect(date).not.toBeNull();
    // The whole point: local getters must return the same calendar day the
    // string names, in every timezone. `new Date("2026-07-03")` is UTC midnight
    // and reports 2026-07-02 anywhere west of Greenwich.
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(3);
    expect(date?.getHours()).toBe(0);
  });

  it('rejects calendar dates that do not exist instead of rolling them forward', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
    expect(parseLocalDate('2026-13-01')).toBeNull();
    expect(parseLocalDate('2026-00-10')).toBeNull();
  });

  it('accepts a leap day in a leap year and rejects it otherwise', () => {
    expect(parseLocalDate('2028-02-29')).not.toBeNull();
    expect(parseLocalDate('2027-02-29')).toBeNull();
  });

  it('rejects junk without producing an Invalid Date', () => {
    for (const value of ['', 'TBA', 'summer 2027', '26-07-03', null, undefined, 42, {}]) {
      expect(parseLocalDate(value)).toBeNull();
    }
  });

  it('tolerates a full ISO timestamp by taking the date part', () => {
    expect(toDateString(parseLocalDate('2027-08-05T18:30:00Z')!)).toBe('2027-08-05');
  });
});

describe('year and month extraction', () => {
  it('reports the calendar year and zero-based month', () => {
    expect(yearOf('2027-01-01')).toBe(2027);
    expect(monthOf('2027-01-01')).toBe(0);
    expect(monthOf('2027-12-31')).toBe(11);
  });

  it('returns null rather than NaN for unusable input', () => {
    expect(yearOf('nope')).toBeNull();
    expect(monthOf('nope')).toBeNull();
  });

  it('builds year-qualified bucket keys that sort chronologically', () => {
    const keys = [monthKey(2027, 0), monthKey(2026, 6), monthKey(2026, 11)];
    expect([...keys].sort()).toEqual(['2026-07', '2026-12', '2027-01']);
  });
});

describe('formatDateRange', () => {
  it('collapses a same-month range', () => {
    expect(formatDateRange('2026-07-03', '2026-07-05')).toBe('Jul 3-5, 2026');
  });

  it('spells out a cross-month range', () => {
    expect(formatDateRange('2026-07-30', '2026-08-02')).toBe('Jul 30 - Aug 2, 2026');
  });

  it('names both years for a New Year festival', () => {
    expect(formatDateRange('2026-12-30', '2027-01-02')).toBe('Dec 30, 2026 - Jan 2, 2027');
  });

  it('collapses a single-day festival', () => {
    expect(formatDateRange('2027-05-01', '2027-05-01')).toBe('May 1, 2027');
  });

  it('degrades to an empty string instead of "Invalid Date"', () => {
    expect(formatDateRange('', '')).toBe('');
    expect(formatDateRange('garbage', '2026-07-05')).toBe('');
  });
});

describe('misc helpers', () => {
  it('counts whole days inclusive of neither end', () => {
    expect(daysBetween('2026-07-03', '2026-07-05')).toBe(2);
    expect(daysBetween('2026-07-03', '2026-07-03')).toBe(0);
    // Crosses a DST boundary in Europe (2026-03-29) — must not report 0.9 days.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('startOfToday strips the clock', () => {
    const midnight = startOfToday(new Date(2026, 6, 3, 23, 59, 59));
    expect(toDateString(midnight)).toBe('2026-07-03');
    expect(midnight.getHours()).toBe(0);
  });

  it('formats a scraper timestamp and survives a missing one', () => {
    expect(formatUpdatedAt('2026-03-09 18:11:52')).toBe('9 Mar 2026');
    expect(formatUpdatedAt(null)).toBeNull();
  });
});

describe('formatYearRange', () => {
  it('renders a single year, a span, and nothing at all', () => {
    expect(formatYearRange([2026])).toBe('2026');
    expect(formatYearRange([2026, 2027, 2028])).toBe('2026-2028');
    expect(formatYearRange([])).toBe('');
  });
});
