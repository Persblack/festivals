import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SINS, getGenreCategory } from "./genre-utils";

// Festival dates live in one place. Re-exported here so the many existing
// `@/lib/utils` imports keep working against a single implementation.
export { formatDateRange, formatMonthDay, formatUpdatedAt, parseLocalDate } from "./dates";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REGIONAL_INDICATOR_A = 0x1f1e6;

/**
 * Flag emoji for any ISO-3166 alpha-2 code, derived from regional indicator
 * symbols instead of a hand-kept table — a country new to the dataset (the
 * scraper reaches further every year) renders without a code change.
 */
export function getCountryFlag(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🌍';
  return String.fromCodePoint(
    ...[...code].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65),
  );
}

/** Colour of the sin a genre belongs to; sub-genres share their category's. */
export function getGenreColorHex(genre: string): string {
  return SINS[getGenreCategory(genre)].color;
}

export function getSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    'small': 'Intimate (< 10k)',
    'medium': 'Medium (10k-50k)',
    'large': 'Large (50k-100k)',
    'massive': 'Massive (100k+)',
  };
  return labels[size] || size;
}



export function formatPriceRange(
  min: number | null,
  max: number | null,
  currency: string = 'EUR'
): string {
  const symbol = currency === 'EUR' ? '€' : currency;
  if (min === null && max === null) {
    return 'Price TBA';
  }
  if (min !== null && max !== null) {
    if (min === max) {
      return `${symbol}${min}`;
    }
    return `${symbol}${min}-${symbol}${max}`;
  }
  if (min !== null) {
    return `From ${symbol}${min}`;
  }
  return `Up to ${symbol}${max}`;
}

export function getGenreCoverImage(genres: string[]): string {
  const genre = genres[0]?.toLowerCase() || 'else';
  const genreMap: Record<string, string> = {
    'edm': '/cover_edm.webp',
    'techno': '/cover_techno.webp',
    'rock': '/cover_rock.webp',
    'metal': '/cover_metal.webp',
    'else': '/cover_else.webp',
  };
  return genreMap[genre] || '/cover_else.webp';
}

export function getArtistCoverImage(genres: string[]): string {
  const genre = genres[0]?.toLowerCase() || 'else';
  const genreMap: Record<string, string> = {
    'edm': '/artist_edm.webp',
    'techno': '/artist_techno.webp',
    'rock': '/artist_rock.webp',
    'metal': '/artist_metal.webp',
    'else': '/artist_else.webp',
  };
  return genreMap[genre] || '/artist_else.webp';
}

export function getUniqueCountries(festivals: { country_code: string; country_name: string }[]) {
  const countryMap = new Map<string, string>();
  festivals.forEach(f => {
    if (f.country_code && f.country_name) {
      countryMap.set(f.country_code, f.country_name);
    }
  });
  return Array.from(countryMap.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
