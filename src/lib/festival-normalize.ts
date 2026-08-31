/**
 * Pure normalization of raw scraper rows into `Festival[]`.
 *
 * Kept free of any data import so it can be unit-tested without the dataset
 * (`src/data/festivals.json` is gitignored). `festival-data.ts` is the seam
 * that actually reads the files and calls in here.
 */

import type { DataHealth, Festival, FestivalSize } from '@/types/festival';
import { GENRE_CATEGORY_MAP } from '@/lib/genre-utils';
import { isRecord } from '@/lib/guards';
import { parseLocalDate, toDateString } from '@/lib/dates';

/** A scraper regression that guts the dataset must fail the build, not ship a stub site. */
const MAX_DROP_RATIO = 0.05;

const SIZE_BY_NAME: Record<string, FestivalSize> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  massive: 'massive',
};

export interface NormalizeResult {
  festivals: Festival[];
  health: DataHealth;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const entry of value) {
    const text = asTrimmedString(entry);
    if (text) unique.add(text);
  }
  return [...unique];
}

function asFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof num === 'number' && Number.isFinite(num) ? num : null;
}

/**
 * Coordinate pair, or null when unusable. Rejects out-of-range values and
 * exactly 0/0 — Null Island is the classic "geocoder gave up" sentinel, and no
 * Central European festival is in the Gulf of Guinea.
 */
function asCoordinatePair(
  rawLat: unknown,
  rawLng: unknown,
): { latitude: number; longitude: number } | null {
  const latitude = asFiniteNumber(rawLat);
  const longitude = asFiniteNumber(rawLng);
  if (latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
}

function asHttpUrl(value: unknown): string | null {
  const text = asTrimmedString(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Normalize and validate raw rows.
 *
 * A row is **dropped** only when it cannot be identified or placed in time
 * (no id, no name, unparseable start date, duplicate id). Everything else is
 * **repaired** and reported, because a festival with a broken price field is
 * still a festival someone wants to find.
 */
export function normalizeFestivals(
  input: unknown,
  options: { sourceFiles?: string[]; maxDropRatio?: number } = {},
): NormalizeResult {
  if (!Array.isArray(input)) {
    throw new Error(
      'Festival data: expected an array of festival rows (or a { festivals: [...] } file), got ' +
        (input === null ? 'null' : typeof input),
    );
  }

  const dropped: DataHealth['dropped'] = [];
  const repairs: DataHealth['repairs'] = {};
  const festivals: Festival[] = [];
  const indexById = new Map<string, number>();

  const repaired = (reason: string, id: string) => {
    const entry = repairs[reason] ?? (repairs[reason] = { count: 0, samples: [] });
    entry.count += 1;
    if (entry.samples.length < 5) entry.samples.push(id);
  };

  for (const [index, raw] of input.entries()) {
    if (!isRecord(raw)) {
      dropped.push({ id: `row #${index}`, reason: 'not an object' });
      continue;
    }

    const id = asTrimmedString(raw.id);
    if (!id) {
      dropped.push({ id: `row #${index}`, reason: 'missing id' });
      continue;
    }
    const name = asTrimmedString(raw.name);
    if (!name) {
      dropped.push({ id, reason: 'missing name' });
      continue;
    }
    const startDate = parseLocalDate(raw.start_date);
    if (!startDate) {
      dropped.push({ id, reason: `unparseable start_date (${JSON.stringify(raw.start_date)})` });
      continue;
    }

    const startIso = toDateString(startDate);
    const endDate = parseLocalDate(raw.end_date);
    let endIso = endDate ? toDateString(endDate) : startIso;
    if (!endDate) {
      repaired('end_date missing or unparseable (clamped to start)', id);
    } else if (endIso < startIso) {
      repaired('end_date before start_date (clamped to start)', id);
      endIso = startIso;
    }

    // Duplicate ids: newest scrape wins, ties go to the first file read. Deterministic
    // either way, so two builds of the same data never disagree.
    const existingIndex = indexById.get(id);
    if (existingIndex !== undefined) {
      const incomingUpdate = asTrimmedString(raw.last_updated) ?? '';
      const keptUpdate = festivals[existingIndex].last_updated ?? '';
      if (incomingUpdate > keptUpdate) {
        dropped.push({ id, reason: 'duplicate id (older row superseded)' });
      } else {
        dropped.push({ id, reason: 'duplicate id (ignored)' });
        continue;
      }
    }

    // Report every unknown genre, even when the row keeps another one: a genre
    // the site does not know is a genre nobody can filter or colour, and the
    // build log is where a new scraper genre should surface.
    const sourceGenres = asStringArray(raw.genres);
    const genres = sourceGenres.filter((genre) => Object.hasOwn(GENRE_CATEGORY_MAP, genre));
    for (const genre of sourceGenres) {
      if (!genres.includes(genre)) {
        repaired(`unrecognized genre "${genre}" (add it to GENRE_CATEGORY_MAP)`, id);
      }
    }
    if (genres.length === 0) {
      repaired('no recognized genre (fell back to Else)', id);
      genres.push('Else');
    }

    const rawSize = asTrimmedString(raw.size)?.toLowerCase() ?? '';
    const size = SIZE_BY_NAME[rawSize];
    if (!size) repaired('unknown size (fell back to medium)', id);

    const coordinates = asCoordinatePair(raw.latitude, raw.longitude);
    if (!coordinates) repaired('missing or implausible coordinates (excluded from map)', id);

    const website = asHttpUrl(raw.website);
    if (!website) repaired('no usable website URL', id);

    let priceMin = asFiniteNumber(raw.ticket_price_min);
    let priceMax = asFiniteNumber(raw.ticket_price_max);
    if (priceMin !== null && priceMin < 0) priceMin = null;
    if (priceMax !== null && priceMax < 0) priceMax = null;
    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      repaired('ticket price min > max (swapped)', id);
      [priceMin, priceMax] = [priceMax, priceMin];
    }

    const year = startDate.getFullYear();
    if (asFiniteNumber(raw.year) !== year) {
      repaired('year field disagreed with start_date (derived from start_date)', id);
    }

    const festival: Festival = {
      id,
      name,
      description: asTrimmedString(raw.description),
      start_date: startIso,
      end_date: endIso,
      year,
      city: asTrimmedString(raw.city) ?? '',
      country_code: (asTrimmedString(raw.country_code) ?? '').toUpperCase().slice(0, 2),
      country_name: asTrimmedString(raw.country_name) ?? '',
      venue: asTrimmedString(raw.venue) ?? '',
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      genres,
      size: size ?? 'medium',
      featured: raw.featured === true,
      website,
      ticket_link: asHttpUrl(raw.ticket_link),
      instagram: asHttpUrl(raw.instagram),
      lineup: asStringArray(raw.lineup),
      ticket_price_min: priceMin,
      ticket_price_max: priceMax,
      currency: (asTrimmedString(raw.currency) ?? 'EUR').toUpperCase(),
      sources: asStringArray(raw.sources),
      last_updated: asTrimmedString(raw.last_updated),
      data_quality_score: asFiniteNumber(raw.data_quality_score) ?? 0,
      lineup_source: asTrimmedString(raw.lineup_source),
    };

    if (existingIndex !== undefined) {
      festivals[existingIndex] = festival;
    } else {
      indexById.set(id, festivals.length);
      festivals.push(festival);
    }
  }

  festivals.sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name),
  );

  const festivalsPerYear: Record<number, number> = {};
  for (const festival of festivals) {
    festivalsPerYear[festival.year] = (festivalsPerYear[festival.year] ?? 0) + 1;
  }

  const health: DataHealth = {
    total: input.length,
    kept: festivals.length,
    dropped,
    repairs,
    festivalsPerYear,
    sourceFiles: options.sourceFiles ?? [],
  };

  if (festivals.length === 0) {
    throw new Error('Festival data: every row was rejected — refusing to build an empty site.');
  }
  const maxDropRatio = options.maxDropRatio ?? MAX_DROP_RATIO;
  const dropRatio = dropped.length / input.length;
  if (dropRatio > maxDropRatio) {
    throw new Error(
      `Festival data: rejected ${dropped.length}/${input.length} rows ` +
        `(${(dropRatio * 100).toFixed(1)}%, limit ${(maxDropRatio * 100).toFixed(0)}%). ` +
        `First reasons: ${dropped
          .slice(0, 5)
          .map((drop) => `${drop.id}: ${drop.reason}`)
          .join('; ')}`,
    );
  }

  return { festivals, health };
}


