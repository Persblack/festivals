export interface Festival {
  id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
    venue: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  dates: {
    start: string;
    end: string;
    year: number;
  };
  genres: Genre[];
  size: FestivalSize;
  ticketInfo: {
    priceRange: string;
    currency: string;
    ticketLink: string;
  };
  website: string;
  instagram?: string;
  image?: string;
  featured: boolean;
  lineup?: string[];
  reviewSummary?: string;
  historicalData?: {
    years: {
      year: number;
      attendance: number;
      notable_acts: string[];
    }[];
  };
}

export type Genre = 'EDM' | 'Techno' | 'Rock' | 'Metal' | 'Else';

export type FestivalSize = 'small' | 'medium' | 'large' | 'massive';

export interface Filters {
  genres: Genre[];
  countries: string[];
  search: string;
}
