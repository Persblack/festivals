/**
 * The one filter/sort/group implementation for every view.
 *
 * Before this module, List, Map, Timeline and Calendar each carried their own
 * copy of the same predicate chain — which is why the year dimension had to be
 * added in one place instead of four.
 *
 * Semantics (rolling window): the default view is everything from today
 * forward, whatever year it lands in. `years: []` means "all years in the
 * dataset"; the month window is a month-of-year window and is deliberately
 * year-independent ("show me every summer").
 */

import type { Festival, Filters } from '@/types/festival';
import { genreMatchesCategories, type GenreCategory } from '@/lib/genre-utils';
import { monthKey, MONTH_NAMES, parseLocalDate, startOfToday } from '@/lib/dates';

export type SortOption = 'date' | 'name' | 'country';

export const ALL_MONTHS: [number, number] = [1, 12];

export function defaultFilters(): Filters {
  return {
    subGenres: [],
    countries: [],
    sizes: [],
    months: [...ALL_MONTHS] as [number, number],
    years: [],
    search: '',
    showPast: false,
  };
}

/**
 * Lowercased haystack per festival (name + city + lineup), built once per
 * dataset. Without it every keystroke lowercases every name and every lineup
 * entry again — ~8k strings today, and lineups only grow.
 */
export function buildSearchIndex(festivals: Festival[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const festival of festivals) {
    index.set(
      festival.id,
      `${festival.name}\n${festival.city}\n${festival.lineup.join('\n')}`.toLowerCase(),
    );
  }
  return index;
}

export interface FilterOptions {
  searchIndex?: Map<string, string>;
  /** Injectable clock — the tests need a fixed "today". */
  now?: Date;
}

export function applyFilters(
  festivals: Festival[],
  filters: Filters,
  globalGenres: GenreCategory[],
  options: FilterOptions = {},
): Festival[] {
  const today = startOfToday(options.now);
  const todayTime = today.getTime();
  const term = filters.search.trim().toLowerCase();
  const [monthFrom, monthTo] = filters.months;
  const wholeYear = monthFrom <= 1 && monthTo >= 12;
  const anyYear = filters.years.length === 0;
  const searchIndex = options.searchIndex;

  return festivals.filter((festival) => {
    if (!genreMatchesCategories(festival.genres, globalGenres)) return false;

    if (
      filters.subGenres.length > 0 &&
      !festival.genres.some((genre) => filters.subGenres.includes(genre))
    ) {
      return false;
    }

    if (
      filters.countries.length > 0 &&
      !filters.countries.includes(festival.country_code)
    ) {
      return false;
    }

    // The size filter offers three buckets; "massive" rides along with "large".
    if (
      filters.sizes.length > 0 &&
      !filters.sizes.includes(festival.size === 'massive' ? 'large' : festival.size)
    ) {
      return false;
    }

    if (!anyYear && !filters.years.includes(festival.year)) return false;

    if (!wholeYear) {
      const start = parseLocalDate(festival.start_date);
      if (!start) return false;
      const month = start.getMonth() + 1;
      if (month < monthFrom || month > monthTo) return false;
    }

    if (!filters.showPast) {
      const end = parseLocalDate(festival.end_date);
      if (!end || end.getTime() < todayTime) return false;
    }

    if (term) {
      const haystack =
        searchIndex?.get(festival.id) ??
        `${festival.name}\n${festival.city}\n${festival.lineup.join('\n')}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    return true;
  });
}

export function sortFestivals(festivals: Festival[], sortBy: SortOption): Festival[] {
  const sorted = [...festivals];
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'country':
      sorted.sort(
        (a, b) =>
          a.country_name.localeCompare(b.country_name) ||
          a.start_date.localeCompare(b.start_date),
      );
      break;
    case 'date':
    default:
      sorted.sort(
        (a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name),
      );
      break;
  }
  return sorted;
}

export interface MonthGroup {
  /** `2026-07` — stable DOM id and React key. */
  key: string;
  year: number;
  /** Zero-based. */
  month: number;
  /** `July 2026` */
  label: string;
  /** `Jul '26` — for the jump navigation. */
  shortLabel: string;
  festivals: Festival[];
}

/**
 * Group chronologically by **year and** month. Grouping by month alone merges
 * July 2026 into July 2027 the moment a second season is loaded.
 */
export function groupByMonth(festivals: Festival[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const festival of festivals) {
    const start = parseLocalDate(festival.start_date);
    if (!start) continue;
    const year = start.getFullYear();
    const month = start.getMonth();
    const key = monthKey(year, month);

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        year,
        month,
        label: `${MONTH_NAMES[month]} ${year}`,
        shortLabel: `${MONTH_NAMES[month].slice(0, 3)} '${String(year).slice(2)}`,
        festivals: [],
      };
      groups.set(key, group);
    }
    group.festivals.push(festival);
  }

  const ordered = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const group of ordered) {
    group.festivals.sort(
      (a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name),
    );
  }
  return ordered;
}

/** Ascending years present in a festival list — the source for the year chips. */
export function availableYears(festivals: Festival[]): number[] {
  const years = new Set<number>();
  for (const festival of festivals) years.add(festival.year);
  return [...years].sort((a, b) => a - b);
}

/** Festivals that have not ended yet. */
export function upcomingFestivals(festivals: Festival[], now?: Date): Festival[] {
  const todayTime = startOfToday(now).getTime();
  return festivals.filter((festival) => {
    const end = parseLocalDate(festival.end_date);
    return end !== null && end.getTime() >= todayTime;
  });
}

/** How many filters the user has actively set — drives the "Clear all" badge. */
export function activeFilterCount(filters: Filters): number {
  const monthsNarrowed = filters.months[0] > 1 || filters.months[1] < 12;
  return (
    filters.countries.length +
    filters.sizes.length +
    filters.subGenres.length +
    filters.years.length +
    (monthsNarrowed ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.showPast ? 1 : 0)
  );
}
