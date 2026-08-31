export interface Festival {
  id: string;
  name: string;
  description: string | null;
  /** `YYYY-MM-DD`, guaranteed to be a real calendar date after normalization. */
  start_date: string;
  /** `YYYY-MM-DD`, guaranteed `>= start_date` after normalization. */
  end_date: string;
  /** Derived from `start_date` during normalization, never trusted from the source file. */
  year: number;
  city: string;
  country_code: string;
  country_name: string;
  venue: string;
  /** Null when the source has no usable coordinate — such rows stay listed but never reach the map. */
  latitude: number | null;
  longitude: number | null;
  /** Non-empty; unknown source genres are dropped and fall back to `Else`. */
  genres: string[];
  size: FestivalSize;
  featured: boolean;
  /** Null when the source has no absolute http(s) URL. */
  website: string | null;
  ticket_link: string | null;
  instagram: string | null;
  lineup: string[];
  ticket_price_min: number | null;
  ticket_price_max: number | null;
  currency: string;
  sources: string[];
  last_updated: string | null;
  data_quality_score: number;
  lineup_source?: string | null;
}

/** A festival that is safe to place on the map. See `hasCoordinates`. */
export type MappableFestival = Festival & { latitude: number; longitude: number };

export type GenreCategory = 'EDM' | 'Hip-Hop' | 'Rock' | 'Metal' | 'Else';

export type FestivalSize = 'small' | 'medium' | 'large' | 'massive';

export const FESTIVAL_SIZES: readonly FestivalSize[] = ['small', 'medium', 'large', 'massive'];

export interface Artist {
  name: string;
  festivalCount: number;
  festivals: Festival[];
  genres: string[];
}

export interface Filters {
  subGenres: string[];
  countries: string[];
  sizes: FestivalSize[];
  /** `[startMonth, endMonth]`, 1-12 — a month-of-year window, independent of the year. */
  months: [number, number];
  /** Empty means every year in the dataset (the rolling-window default). */
  years: number[];
  search: string;
  showPast: boolean;
}

/** What normalization had to repair or reject. Reported at build time. */
export interface DataHealth {
  /** Rows present in the source files. */
  total: number;
  /** Rows that survived normalization. */
  kept: number;
  /** Rows rejected as unusable, with the reason. */
  dropped: { id: string; reason: string }[];
  /** Rows kept after repair, grouped by what was repaired. */
  repairs: Record<string, { count: number; samples: string[] }>;
  festivalsPerYear: Record<number, number>;
  sourceFiles: string[];
}
