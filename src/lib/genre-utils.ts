export type DisplayGenre =
  | 'EDM' | 'Techno' | 'Rock' | 'Metal' | 'Else'
  | 'Classical' | 'Folk' | 'Hardcore' | 'Hip-Hop'
  | 'Jazz' | 'Pop' | 'Punk' | 'Reggae';

export type GenreCategory = 'EDM' | 'Hip-Hop' | 'Rock' | 'Metal' | 'Else';

const GENRE_CATEGORY_MAP: Record<DisplayGenre, GenreCategory> = {
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
};

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
  return GENRE_CATEGORY_MAP[genre as DisplayGenre] ?? 'Else';
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
