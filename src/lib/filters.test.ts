import { describe, expect, it } from 'vitest';
import type { Festival, Filters } from '@/types/festival';
import {
  activeFilterCount,
  applyFilters,
  availableYears,
  buildSearchIndex,
  defaultFilters,
  groupByMonth,
  sortFestivals,
  upcomingFestivals,
} from './filters';

/** Fixed clock so "upcoming" is deterministic. */
const NOW = new Date(2026, 5, 15); // 15 June 2026, local

function festival(overrides: Partial<Festival> & { id: string; start_date: string }): Festival {
  const start = overrides.start_date;
  return {
    name: `Festival ${overrides.id}`,
    description: null,
    end_date: start,
    year: Number(start.slice(0, 4)),
    city: 'Berlin',
    country_code: 'DE',
    country_name: 'Germany',
    venue: '',
    latitude: 52.5,
    longitude: 13.4,
    genres: ['Rock'],
    size: 'medium',
    featured: false,
    website: null,
    ticket_link: null,
    instagram: null,
    lineup: [],
    ticket_price_min: null,
    ticket_price_max: null,
    currency: 'EUR',
    sources: [],
    last_updated: null,
    data_quality_score: 0,
    ...overrides,
  };
}

const july2026 = festival({ id: 'a', start_date: '2026-07-10', end_date: '2026-07-12' });
const july2027 = festival({ id: 'b', start_date: '2027-07-09', end_date: '2027-07-11', year: 2027 });
const jan2027 = festival({ id: 'c', start_date: '2027-01-15', end_date: '2027-01-16', year: 2027 });
const past2026 = festival({ id: 'd', start_date: '2026-03-01', end_date: '2026-03-02' });
const dataset = [past2026, july2026, jan2027, july2027];

function filters(overrides: Partial<Filters> = {}): Filters {
  return { ...defaultFilters(), ...overrides };
}

describe('applyFilters — rolling window', () => {
  it('shows every future year by default and hides what has ended', () => {
    const result = applyFilters(dataset, filters(), [], { now: NOW });
    expect(result.map((f) => f.id)).toEqual(['a', 'c', 'b']);
  });

  it('keeps a festival that is running right now', () => {
    const running = festival({ id: 'live', start_date: '2026-06-13', end_date: '2026-06-16' });
    const result = applyFilters([running], filters(), [], { now: NOW });
    expect(result).toHaveLength(1);
  });

  it('keeps a festival ending today (local midnight comparison, not a timestamp)', () => {
    const endsToday = festival({ id: 'today', start_date: '2026-06-14', end_date: '2026-06-15' });
    const result = applyFilters([endsToday], filters(), [], { now: new Date(2026, 5, 15, 22) });
    expect(result).toHaveLength(1);
  });

  it('includes past festivals only when asked', () => {
    const result = applyFilters(dataset, filters({ showPast: true }), [], { now: NOW });
    expect(result.map((f) => f.id)).toEqual(['d', 'a', 'c', 'b']);
  });
});

describe('applyFilters — year dimension', () => {
  it('narrows to a single season', () => {
    const result = applyFilters(dataset, filters({ years: [2027] }), [], { now: NOW });
    expect(result.map((f) => f.id)).toEqual(['c', 'b']);
  });

  it('accepts several seasons at once', () => {
    const result = applyFilters(dataset, filters({ years: [2026, 2027] }), [], { now: NOW });
    expect(result).toHaveLength(3);
  });

  it('an empty year list means every year, not no year', () => {
    expect(applyFilters(dataset, filters({ years: [] }), [], { now: NOW })).toHaveLength(3);
  });

  it('a year with no data yields an empty list rather than everything', () => {
    expect(applyFilters(dataset, filters({ years: [2030] }), [], { now: NOW })).toHaveLength(0);
  });
});

describe('applyFilters — month window is year-independent', () => {
  it('matches the same month across every season', () => {
    const result = applyFilters(dataset, filters({ months: [7, 7] }), [], { now: NOW });
    expect(result.map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('combines with the year chips', () => {
    const result = applyFilters(dataset, filters({ months: [7, 7], years: [2027] }), [], {
      now: NOW,
    });
    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('excludes months outside the window', () => {
    const result = applyFilters(dataset, filters({ months: [1, 2] }), [], { now: NOW });
    expect(result.map((f) => f.id)).toEqual(['c']);
  });
});

describe('applyFilters — other dimensions', () => {
  const metal = festival({
    id: 'm',
    start_date: '2026-08-01',
    genres: ['Metal', 'Punk'],
    country_code: 'AT',
    country_name: 'Austria',
    size: 'massive',
    lineup: ['Ghost', 'Amon Amarth'],
  });
  const pool = [july2026, metal];

  it('matches the global genre category, not the literal genre', () => {
    // Punk belongs to the Rock category.
    expect(applyFilters(pool, filters(), ['Rock'], { now: NOW }).map((f) => f.id)).toEqual([
      'a',
      'm',
    ]);
    expect(applyFilters(pool, filters(), ['Metal'], { now: NOW }).map((f) => f.id)).toEqual(['m']);
  });

  it('treats massive as large in the size filter', () => {
    expect(
      applyFilters(pool, filters({ sizes: ['large'] }), [], { now: NOW }).map((f) => f.id),
    ).toEqual(['m']);
  });

  it('filters by country code', () => {
    expect(
      applyFilters(pool, filters({ countries: ['AT'] }), [], { now: NOW }).map((f) => f.id),
    ).toEqual(['m']);
  });

  it('searches lineup and name case-insensitively, with and without an index', () => {
    const index = buildSearchIndex(pool);
    for (const options of [{ now: NOW }, { now: NOW, searchIndex: index }]) {
      expect(applyFilters(pool, filters({ search: 'amon' }), [], options).map((f) => f.id)).toEqual([
        'm',
      ]);
      expect(
        applyFilters(pool, filters({ search: 'FESTIVAL a' }), [], options).map((f) => f.id),
      ).toEqual(['a']);
    }
  });

  it('the search index and the inline path agree', () => {
    const index = buildSearchIndex(dataset);
    const withIndex = applyFilters(dataset, filters({ search: 'berlin' }), [], {
      now: NOW,
      searchIndex: index,
    });
    const without = applyFilters(dataset, filters({ search: 'berlin' }), [], { now: NOW });
    expect(withIndex).toEqual(without);
  });
});

describe('groupByMonth', () => {
  it('never merges the same month of two different years', () => {
    const groups = groupByMonth([july2026, july2027]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.key)).toEqual(['2026-07', '2027-07']);
    expect(groups.map((g) => g.label)).toEqual(['July 2026', 'July 2027']);
    expect(groups.map((g) => g.shortLabel)).toEqual(["Jul '26", "Jul '27"]);
  });

  it('orders groups chronologically across the year boundary', () => {
    const groups = groupByMonth([july2027, july2026, jan2027]);
    expect(groups.map((g) => g.key)).toEqual(['2026-07', '2027-01', '2027-07']);
  });

  it('sorts festivals inside a group by start date', () => {
    const late = festival({ id: 'late', start_date: '2026-07-28' });
    const early = festival({ id: 'early', start_date: '2026-07-02' });
    const [group] = groupByMonth([late, early]);
    expect(group.festivals.map((f) => f.id)).toEqual(['early', 'late']);
  });

  it('skips rows whose dates cannot be read instead of creating a junk bucket', () => {
    const broken = festival({ id: 'broken', start_date: 'TBA' });
    expect(groupByMonth([broken, july2026]).map((g) => g.key)).toEqual(['2026-07']);
  });
});

describe('sorting and derived helpers', () => {
  it('sorts by date across years', () => {
    expect(sortFestivals(dataset, 'date').map((f) => f.id)).toEqual(['d', 'a', 'c', 'b']);
  });

  it('sorts by name and by country without mutating the input', () => {
    const before = dataset.map((f) => f.id);
    expect(sortFestivals(dataset, 'name')[0].name).toBe('Festival a');
    expect(sortFestivals(dataset, 'country')).toHaveLength(4);
    expect(dataset.map((f) => f.id)).toEqual(before);
  });

  it('lists the years present, ascending', () => {
    expect(availableYears(dataset)).toEqual([2026, 2027]);
    expect(availableYears([])).toEqual([]);
  });

  it('upcomingFestivals drops what has ended', () => {
    expect(upcomingFestivals(dataset, NOW).map((f) => f.id)).toEqual(['a', 'c', 'b']);
  });

  it('counts active filters, including the year chips', () => {
    expect(activeFilterCount(defaultFilters())).toBe(0);
    expect(activeFilterCount(filters({ years: [2027] }))).toBe(1);
    expect(activeFilterCount(filters({ months: [6, 8] }))).toBe(1);
    expect(activeFilterCount(filters({ months: [1, 12] }))).toBe(0);
    expect(activeFilterCount(filters({ years: [2026, 2027], search: 'x', showPast: true }))).toBe(4);
  });
});
