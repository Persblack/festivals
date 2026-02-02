export interface Festival {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  year: number;
  city: string;
  country_code: string;
  country_name: string;
  venue: string;
  latitude: number;
  longitude: number;
  genres: Genre[];
  size: FestivalSize;
  featured: boolean;
  website: string;
  ticket_link: string | null;
  instagram: string | null;
  lineup: string[];
  ticket_price_min: number | null;
  ticket_price_max: number | null;
  currency: string;
  sources: string[];
  last_updated: string;
  data_quality_score: number;
}

export interface FestivalsData {
  generated_at: string;
  count: number;
  festivals: Festival[];
}

export type Genre = 'EDM' | 'Techno' | 'Rock' | 'Metal' | 'Else';

export type FestivalSize = 'small' | 'medium' | 'large' | 'massive';

export interface Filters {
  genres: Genre[];
  countries: string[];
  search: string;
}
