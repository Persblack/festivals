import type { GenreCategory } from '@/types/festival';

export type { GenreCategory };

export type DisplayGenre =
  | 'EDM' | 'Techno' | 'Rock' | 'Metal' | 'Else'
  | 'Classical' | 'Folk' | 'Hardcore' | 'Hip-Hop'
  | 'Jazz' | 'Pop' | 'Punk' | 'Reggae';

/**
 * Every genre the site knows how to colour, badge and filter. Normalization
 * drops source genres missing from this map, so a new scraper genre shows up as
 * a build-time repair note instead of an uncoloured badge nobody can filter.
 */
export const GENRE_CATEGORY_MAP: Record<string, GenreCategory> = {
  EDM: 'EDM',
  Techno: 'EDM',
  Hardcore: 'EDM',
  'Hip-Hop': 'Hip-Hop',
  Rock: 'Rock',
  Punk: 'Rock',
  Metal: 'Metal',
  Else: 'Else',
  Classical: 'Else',
  Folk: 'Else',
  Jazz: 'Else',
  Pop: 'Else',
  Reggae: 'Else',
} satisfies Record<DisplayGenre, GenreCategory>;

// Sub-genres only (excludes the main category names)
export const SUB_GENRES: { value: string; label: string; category: GenreCategory }[] = [
  { value: 'Techno', label: 'Techno', category: 'EDM' },
  { value: 'Hardcore', label: 'Hardcore', category: 'EDM' },
  { value: 'Punk', label: 'Punk', category: 'Rock' },
  { value: 'Classical', label: 'Classical', category: 'Else' },
  { value: 'Folk', label: 'Folk', category: 'Else' },
  { value: 'Jazz', label: 'Jazz', category: 'Else' },
  { value: 'Pop', label: 'Pop', category: 'Else' },
  { value: 'Reggae', label: 'Reggae', category: 'Else' },
];

/**
 * The brand: each filter category is a sin. Five categories, so five sins;
 * Greed and Sloth wait for a category of their own. Colours are light enough
 * for dark ink on a filled badge and for text on the dark ground (>= 4.5:1).
 */
export const SINS = {
  EDM: { sin: 'Lust', color: '#FF6FB0' },
  'Hip-Hop': { sin: 'Envy', color: '#7BD389' },
  Rock: { sin: 'Pride', color: '#B79CFF' },
  Metal: { sin: 'Wrath', color: '#FF5C5C' },
  Else: { sin: 'Gluttony', color: '#FF9F43' },
} satisfies Record<GenreCategory, { sin: string; color: string }>;

export const GENRE_CATEGORIES = Object.keys(SINS) as GenreCategory[];

export function isGenreCategory(value: string): value is GenreCategory {
  return Object.hasOwn(SINS, value);
}

export function getGenreCategory(genre: string): GenreCategory {
  // Object.hasOwn, not `in`/`?.`: 'constructor' and 'toString' would otherwise
  // resolve through the prototype chain and pass as known genres.
  return Object.hasOwn(GENRE_CATEGORY_MAP, genre) ? GENRE_CATEGORY_MAP[genre] : 'Else';
}

export function genreMatchesCategories(
  festivalGenres: string[],
  selectedCategories: GenreCategory[]
): boolean {
  if (selectedCategories.length === 0) return true;
  return festivalGenres.some(g =>
    selectedCategories.includes(getGenreCategory(g))
  );
}
