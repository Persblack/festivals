import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GenreBadge } from "./GenreBadge";
import type { Genre, Filters } from "@/types/festival";

const GENRES: Genre[] = ["EDM", "Techno", "Rock", "Metal", "Else"];
const COUNTRIES = [
  { code: "BE", name: "Belgium" },
  { code: "DE", name: "Germany" },
  { code: "RS", name: "Serbia" },
  { code: "HU", name: "Hungary" },
  { code: "AT", name: "Austria" },
];

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showSort?: boolean;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  resultCount: number;
}

export function FilterBar({
  filters,
  onFiltersChange,
  showSort = false,
  sortBy = "date",
  onSortChange,
  resultCount,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleGenre = (genre: Genre) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const toggleCountry = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  const clearFilters = () => {
    onFiltersChange({ genres: [], countries: [], search: "" });
  };

  const activeFilterCount =
    filters.genres.length + filters.countries.length + (filters.search ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-lg"
    >
      {/* Search and Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Lineup Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists in lineup..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle (Mobile) */}
        <Button
          variant="outline"
          className="md:hidden"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Sort Dropdown */}
        {showSort && onSortChange && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="country">Country</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}

        {/* Result Count */}
        <span className="text-sm text-muted-foreground ml-auto">
          {resultCount} festival{resultCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Desktop Filters / Expanded Mobile Filters */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : "0", opacity: isExpanded ? 1 : 0 }}
        className={`md:!h-auto md:!opacity-100 overflow-hidden`}
      >
        <div className="flex flex-wrap gap-6 pt-3 border-t border-border md:pt-4">
          {/* Genre Filters */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Genres</span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`transition-all duration-200 ${
                    filters.genres.includes(genre)
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <GenreBadge genre={genre} />
                </button>
              ))}
            </div>
          </div>

          {/* Country Filters */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Countries</span>
            <div className="flex flex-wrap gap-3">
              {COUNTRIES.map((country) => (
                <label
                  key={country.code}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.countries.includes(country.code)}
                    onCheckedChange={() => toggleCountry(country.code)}
                  />
                  <span className="text-sm text-foreground">{country.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Always visible genre pills on desktop */}
      <div className="hidden md:flex flex-wrap gap-2 border-t border-border pt-4">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => toggleGenre(genre)}
            className={`transition-all duration-200 ${
              filters.genres.includes(genre)
                ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <GenreBadge genre={genre} />
          </button>
        ))}

        <div className="w-px h-6 bg-border mx-2" />

        {COUNTRIES.map((country) => (
          <label
            key={country.code}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={filters.countries.includes(country.code)}
              onCheckedChange={() => toggleCountry(country.code)}
            />
            <span className="text-sm text-foreground">{country.name}</span>
          </label>
        ))}
      </div>
    </motion.div>
  );
}
