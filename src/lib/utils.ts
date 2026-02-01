import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'BE': '🇧🇪',
    'DE': '🇩🇪',
    'RS': '🇷🇸',
    'HU': '🇭🇺',
    'AT': '🇦🇹',
    'NL': '🇳🇱',
    'CZ': '🇨🇿',
    'PL': '🇵🇱',
    'CH': '🇨🇭',
  };
  return flags[countryCode] || '🌍';
}

export function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    'EDM': 'bg-genre-edm',
    'Techno': 'bg-genre-techno',
    'Rock': 'bg-genre-rock',
    'Metal': 'bg-genre-metal',
    'Else': 'bg-genre-else',
  };
  return colors[genre] || 'bg-gray-500';
}

export function getGenreColorHex(genre: string): string {
  const colors: Record<string, string> = {
    'EDM': '#3B82F6',
    'Techno': '#06B6D4',
    'Rock': '#EF4444',
    'Metal': '#9CA3AF',
    'Else': '#A855F7',
  };
  return colors[genre] || '#6B7280';
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

export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || '';
}
