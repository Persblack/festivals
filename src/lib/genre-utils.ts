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
