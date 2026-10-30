/**
 * Build-time helpers for the indexable pages: one evergreen URL per festival
 * series, hub pages per country and genre, and their structured data.
 *
 * A series URL drops the year (`wacken-open-air-2027` -> `/festivals/wacken-open-air/`)
 * so links and ranking collect on one page that survives every season.
 */

import type { Festival } from '@/types/festival';
import { GENRE_CATEGORY_MAP, getGenreCategory, isGenreCategory } from '@/lib/genre-utils';
import { MONTH_NAMES, parseLocalDate } from '@/lib/dates';
import { getGenreCoverImage } from '@/lib/utils';

export const SITE_URL = 'https://synners.si';

export function seriesSlug(festivalId: string): string {
  return festivalId.replace(/-(19|20)\d\d$/, '');
}

export function festivalPath(festivalId: string): string {
  return `/festivals/${seriesSlug(festivalId)}/`;
}

/** `in the Netherlands`, `in the Czech Republic`, `in Germany`. */
export function countryInSentence(country: string): string {
  return /^(Netherlands|Czech Republic|United Kingdom|United States)$/.test(country) ? `the ${country}` : country;
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Editions grouped by series, each list sorted by start date. */
export function groupSeries(festivals: Festival[]): Map<string, Festival[]> {
  const series = new Map<string, Festival[]>();
  for (const festival of festivals) {
    const slug = seriesSlug(festival.id);
    const editions = series.get(slug);
    if (editions) editions.push(festival);
    else series.set(slug, [festival]);
  }
  for (const editions of series.values()) {
    editions.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }
  return series;
}

/** The edition a series page leads with: the next one still to come, else the latest. */
export function leadEdition(editions: Festival[], todayIso: string): Festival {
  return editions.find((f) => f.end_date >= todayIso) ?? editions[editions.length - 1];
}

/** Genres that get a hub. `Else` is a catch-all nobody searches for. */
export const HUB_GENRES = Object.keys(GENRE_CATEGORY_MAP).filter((g) => g !== 'Else');

/** Category names (EDM, Rock, ...) include their sub-genres; sub-genres match exactly. */
export function matchesHubGenre(festival: Festival, genre: string): boolean {
  return isGenreCategory(genre)
    ? festival.genres.some((g) => getGenreCategory(g) === genre)
    : festival.genres.includes(genre);
}

/** The season most of these festivals fall in — the year people put in the search. */
export function headlineYear(festivals: Festival[]): number | null {
  const counts = new Map<number, number>();
  for (const f of festivals) counts.set(f.year, (counts.get(f.year) ?? 0) + 1);
  let best: number | null = null;
  for (const [year, count] of counts) {
    if (best === null || count > counts.get(best)!) best = year;
  }
  return best;
}

export function busiestMonth(festivals: Festival[]): string | null {
  const counts = new Array(12).fill(0);
  for (const f of festivals) {
    const date = parseLocalDate(f.start_date);
    if (date) counts[date.getMonth()]++;
  }
  const max = Math.max(...counts);
  return max > 0 ? MONTH_NAMES[counts.indexOf(max)] : null;
}

/** Most frequent values, most common first. */
export function topValues(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([v]) => v);
}

const SIZE_RANK = { massive: 3, large: 2, medium: 1, small: 0 } as const;

/** Biggest first, then the one with the longest lineup. */
export function byProminence(a: Festival, b: Festival): number {
  return SIZE_RANK[b.size] - SIZE_RANK[a.size] || b.lineup.length - a.lineup.length;
}

/** `JSON.stringify` for a `<script type="application/ld+json">`: `<` can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function eventJsonLd(festival: Festival): Record<string, unknown> {
  const hasPrice = festival.ticket_price_min !== null || festival.ticket_price_max !== null;
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `${festival.name} ${festival.year}`,
    startDate: festival.start_date,
    endDate: festival.end_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE_URL}${festivalPath(festival.id)}`,
    image: [`${SITE_URL}${getGenreCoverImage(festival.genres)}`],
    ...(festival.description && { description: festival.description }),
    location: {
      '@type': 'Place',
      name: festival.venue || festival.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: festival.city,
        addressCountry: festival.country_code,
      },
      ...(festival.latitude !== null &&
        festival.longitude !== null && {
          geo: { '@type': 'GeoCoordinates', latitude: festival.latitude, longitude: festival.longitude },
        }),
    },
    ...(festival.lineup.length > 0 && {
      performer: festival.lineup.slice(0, 30).map((name) => ({ '@type': 'PerformingGroup', name })),
    }),
    ...(festival.website && {
      organizer: { '@type': 'Organization', name: festival.name, url: festival.website },
    }),
    ...(hasPrice && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: festival.currency,
        ...(festival.ticket_price_min !== null && { lowPrice: festival.ticket_price_min }),
        ...(festival.ticket_price_max !== null && { highPrice: festival.ticket_price_max }),
        ...((festival.ticket_link ?? festival.website) && { url: festival.ticket_link ?? festival.website }),
      },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export interface Hub {
  path: string;
  /** e.g. `Metal Festivals in Germany` */
  heading: string;
  festivals: Festival[];
  country?: string;
  genre?: string;
}

/** Below this a combo hub would be a thin page; the country and genre hubs still cover it. */
const MIN_COMBO_FESTIVALS = 5;

/** Every hub page, built from the upcoming festivals only. */
export function buildHubs(upcoming: Festival[]): { countries: Hub[]; genres: Hub[]; combos: Hub[] } {
  const byCountry = new Map<string, Festival[]>();
  for (const f of upcoming) {
    if (!f.country_name) continue;
    const list = byCountry.get(f.country_name);
    if (list) list.push(f);
    else byCountry.set(f.country_name, [f]);
  }

  const countries: Hub[] = [...byCountry.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([country, festivals]) => ({
      path: `/countries/${slugify(country)}/`,
      heading: `Music Festivals in ${countryInSentence(country)}`,
      festivals,
      country,
    }));

  const genres: Hub[] = HUB_GENRES.map((genre) => ({
    path: `/genres/${slugify(genre)}/`,
    heading: `${genre} Festivals in Europe`,
    festivals: upcoming.filter((f) => matchesHubGenre(f, genre)),
    genre,
  }))
    .filter((hub) => hub.festivals.length > 0)
    .sort((a, b) => b.festivals.length - a.festivals.length);

  const combos: Hub[] = countries.flatMap((countryHub) =>
    HUB_GENRES.map((genre) => ({
      path: `${countryHub.path}${slugify(genre)}/`,
      heading: `${genre} Festivals in ${countryInSentence(countryHub.country!)}`,
      festivals: countryHub.festivals.filter((f) => matchesHubGenre(f, genre)),
      country: countryHub.country,
      genre,
    })).filter((hub) => hub.festivals.length >= MIN_COMBO_FESTIVALS),
  );

  return { countries, genres, combos };
}

/** `2026-03-09 18:11:52` -> `2026-03-09`; null when there is no usable date. */
export function lastmodOf(festivals: Festival[]): string | null {
  let newest: string | null = null;
  for (const f of festivals) {
    const day = f.last_updated?.slice(0, 10) ?? null;
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day) && (!newest || day > newest)) newest = day;
  }
  return newest;
}
