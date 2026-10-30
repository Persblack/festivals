/**
 * Facts for a festival page that are computed from the dataset (or from the
 * bundled OurAirports extract), never written by hand. Build-time only: the
 * page frontmatter and the sitemap import this, no island does.
 */

import type { Festival } from '@/types/festival';
import { daysBetween, formatDateRange } from '@/lib/dates';
import { byProminence, countryInSentence, seriesSlug } from '@/lib/seo';
import type { Hub } from '@/lib/seo';
import { formatPriceRange } from '@/lib/utils';
import airportsFile from './airports.json';

export interface Airport {
  name: string;
  city: string;
  iata: string;
  lat: number;
  lon: number;
  /** OurAirports `large_airport`: the hubs most visitors fly into. */
  large?: boolean;
}

/** Scheduled large/medium airports with an IATA code, cut to the dataset's area. */
export const AIRPORTS: readonly Airport[] = airportsFile.airports;

const EARTH_RADIUS_KM = 6371.0088;

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The closest airports within `maxKm`, nearest first, distance rounded to
 * whole km. When none of the nearest `limit` is a large airport, the nearest
 * large one in range is added: a regional field with two flights a week is
 * rarely the one people book.
 */
export function nearestAirports(
  lat: number,
  lon: number,
  airports: readonly Airport[] = AIRPORTS,
  { maxKm = 150, limit = 2 } = {},
): { airport: Airport; km: number }[] {
  const inRange = airports
    .map((airport) => ({ airport, km: haversineKm(lat, lon, airport.lat, airport.lon) }))
    .filter((a) => a.km <= maxKm)
    .sort((a, b) => a.km - b.km);
  const picked = inRange.slice(0, limit);
  if (!picked.some((a) => a.airport.large)) {
    const large = inRange.find((a) => a.airport.large);
    if (large) picked.push(large);
  }
  return picked.map((a) => ({ airport: a.airport, km: Math.round(a.km) }));
}

/** `3` for Fri-Sun. A single-day festival is 1. */
export function durationDays(f: Pick<Festival, 'start_date' | 'end_date'>): number {
  return daysBetween(f.start_date, f.end_date) + 1;
}

/** Inclusive ISO date ranges share at least one day. */
export function datesOverlap(
  a: Pick<Festival, 'start_date' | 'end_date'>,
  b: Pick<Festival, 'start_date' | 'end_date'>,
): boolean {
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

/** Key for matching artist names: `OOMPH!`, `Oomph!` and ` oomph! ` are one act. */
export function artistKey(name: string): string {
  return name.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
}

/** Artists of `lineup` that also appear in `other`, spelled as in `lineup`, in its order. */
export function sharedArtists(lineup: string[], other: string[]): string[] {
  const keys = new Set(other.map(artistKey));
  const seen = new Set<string>();
  return lineup.filter((name) => {
    const key = artistKey(name);
    if (!key || !keys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type ArtistIndex = Map<string, Festival[]>;
const artistIndexes = new WeakMap<readonly Festival[], ArtistIndex>();

/** Artist key -> festivals listing that artist. Built once per candidate list. */
function artistIndex(candidates: readonly Festival[]): ArtistIndex {
  let index = artistIndexes.get(candidates);
  if (index) return index;
  index = new Map();
  for (const festival of candidates) {
    for (const key of new Set(festival.lineup.map(artistKey))) {
      if (!key) continue;
      const list = index.get(key);
      if (list) list.push(festival);
      else index.set(key, [festival]);
    }
  }
  artistIndexes.set(candidates, index);
  return index;
}

export interface LineupMatch {
  festival: Festival;
  artists: string[];
}

/**
 * Other festivals (one edition per series, never this series) that book
 * artists from `f`'s lineup. Most shared artists first, then by prominence.
 */
export function sameLineupElsewhere(f: Festival, candidates: readonly Festival[], limit = 6): LineupMatch[] {
  if (f.lineup.length === 0) return [];
  const own = seriesSlug(f.id);
  const index = artistIndex(candidates);
  const hits = new Map<Festival, string[]>();
  const seen = new Set<string>();
  for (const name of f.lineup) {
    const key = artistKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    for (const other of index.get(key) ?? []) {
      if (seriesSlug(other.id) === own) continue;
      const list = hits.get(other);
      if (list) list.push(name);
      else hits.set(other, [name]);
    }
  }
  // One edition per series: the one sharing the most artists, then the earliest.
  const bySeries = new Map<string, LineupMatch>();
  for (const [festival, artists] of hits) {
    const slug = seriesSlug(festival.id);
    const current = bySeries.get(slug);
    if (
      !current ||
      artists.length > current.artists.length ||
      (artists.length === current.artists.length && festival.start_date < current.festival.start_date)
    ) {
      bySeries.set(slug, { festival, artists });
    }
  }
  return [...bySeries.values()]
    .sort((a, b) => b.artists.length - a.artists.length || byProminence(a.festival, b.festival))
    .slice(0, limit);
}

/** First edition per series, in the input order. */
function onePerSeries(festivals: Festival[]): Festival[] {
  const seen = new Set<string>();
  return festivals.filter((f) => {
    const slug = seriesSlug(f.id);
    if (seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

/** Other festivals, any country, whose dates overlap `f`'s. Most prominent first. */
export function sameDates(f: Festival, candidates: readonly Festival[], limit = 6): Festival[] {
  const own = seriesSlug(f.id);
  return onePerSeries(
    candidates.filter((o) => seriesSlug(o.id) !== own && datesOverlap(f, o)).sort(byProminence),
  ).slice(0, limit);
}

/** Other festivals within `maxKm` of `f`, nearest first. Empty without coordinates. */
export function nearbyFestivals(
  f: Festival,
  candidates: readonly Festival[],
  { maxKm = 75, limit = 6 } = {},
): { festival: Festival; km: number }[] {
  if (f.latitude === null || f.longitude === null) return [];
  const { latitude, longitude } = f;
  const own = seriesSlug(f.id);
  const near = candidates
    .filter((o) => o.latitude !== null && o.longitude !== null && seriesSlug(o.id) !== own)
    .map((o) => ({ festival: o, km: haversineKm(latitude, longitude, o.latitude!, o.longitude!) }))
    .filter((o) => o.km <= maxKm)
    .sort((a, b) => a.km - b.km || a.festival.start_date.localeCompare(b.festival.start_date));
  const seen = new Set<string>();
  return near
    .filter((o) => {
      const slug = seriesSlug(o.festival.id);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    })
    .slice(0, limit)
    .map((o) => ({ festival: o.festival, km: Math.round(o.km) }));
}

function hasText(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

/**
 * A series with no description and no lineup in any edition: dates, city and
 * genre only. Its page stays up for visitors but is `noindex` and out of the
 * sitemap. The page and the sitemap both ask this one predicate.
 */
export function isThinSeries(editions: readonly Festival[]): boolean {
  return !editions.some((e) => hasText(e.description) || e.lineup.length > 0);
}

/** `a`, `a and b`, `a, b and c`. */
export function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** Genres for prose. `Else` is the catch-all bucket and reads as nothing. */
export function proseGenres(genres: string[]): string[] {
  return genres.filter((g) => g !== 'Else');
}

/** ` at Wacken Festival Grounds`, or nothing when the venue only repeats the city. */
export function venueClause(f: Pick<Festival, 'venue' | 'city'>): string {
  const venue = f.venue.trim();
  return venue && artistKey(venue) !== artistKey(f.city) ? ` at ${venue}` : '';
}

/** The dataset's size bucket in words. No visitor numbers: the bucket is all we know. */
const SIZE_WORDS: Record<Festival['size'], string> = {
  small: 'an intimate festival',
  medium: 'a medium-sized festival',
  large: 'a large festival',
  massive: 'a massive festival',
};

/**
 * Intro for a festival without a description, built only from its own fields
 * and the other editions of the series.
 */
export function factualIntro(f: Festival, editions: readonly Festival[], isOver: boolean): string {
  const genres = proseGenres(f.genres);
  const days = durationDays(f);
  const length = days === 1 ? 'one-day' : `${days}-day`;
  const sentences = [
    `${f.name} is a ${length} ${genres.length ? `${joinWords(genres)} ` : 'music '}festival in ${f.city}, ${f.country_name}.`,
    `The ${f.year} edition ${isOver ? 'ran' : 'runs'} ${formatDateRange(f.start_date, f.end_date)}${venueClause(f)}.`,
    `Synners lists it as ${SIZE_WORDS[f.size]}.`,
  ];
  if (f.ticket_price_min !== null || f.ticket_price_max !== null) {
    sentences.push(`Listed ticket prices: ${formatPriceRange(f.ticket_price_min, f.ticket_price_max, f.currency)}.`);
  }
  if (f.lineup.length > 0) {
    const first = f.lineup.slice(0, 3);
    sentences.push(
      `${f.lineup.length} ${f.lineup.length === 1 ? 'act has' : 'acts have'} been announced so far, including ${joinWords(first)}.`,
    );
  }
  if (editions.length > 1) {
    sentences.push(`Synners has dates for ${editions.length} editions: ${joinWords(editions.map((e) => String(e.year)))}.`);
  }
  return sentences.join(' ');
}

export interface HubMention {
  path: string;
  /** e.g. `41 upcoming Metal festivals in Germany` */
  label: string;
}

/**
 * The hubs this festival counts towards, with their size: the country hub,
 * then a country x genre hub per genre (or the Europe-wide genre hub when the
 * combination is too small to have one). At most `limit`.
 */
export function hubMentions(
  f: Festival,
  hubs: { countries: Hub[]; genres: Hub[]; combos: Hub[] },
  genreHubs: Hub[],
  limit = 3,
): HubMention[] {
  const mentions: HubMention[] = [];
  const country = hubs.countries.find((h) => h.country === f.country_name);
  const plural = (n: number) => (n === 1 ? 'festival' : 'festivals');
  if (country) {
    const n = country.festivals.length;
    mentions.push({ path: country.path, label: `${n} upcoming ${plural(n)} in ${countryInSentence(country.country!)}` });
  }
  for (const genreHub of genreHubs) {
    const combo = hubs.combos.find((h) => h.country === f.country_name && h.genre === genreHub.genre);
    const hub = combo ?? genreHub;
    const n = hub.festivals.length;
    mentions.push({
      path: hub.path,
      label: `${n} upcoming ${hub.genre} ${plural(n)} ${combo ? `in ${combo.country}` : 'in Europe'}`,
    });
  }
  return mentions.slice(0, limit);
}
