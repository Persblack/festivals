"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Filter } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { SUB_GENRES } from "@/lib/genre-utils";
import { activeFilterCount, defaultFilters } from "@/lib/filters";
import { MONTH_ABBR } from "@/lib/dates";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { FestivalSize, Filters } from "@/types/festival";

const SIZES: { value: FestivalSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const DEFAULT_COUNTRIES = [
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
];

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [localValue, setLocalValue] = useState(value);
  // `window.setTimeout` (not the ambient Node overload) so the handle is a number.
  const timerRef = useRef<number | undefined>(undefined);

  // Sync local state when parent clears the search (e.g. "Clear all")
  useEffect(() => {
    if (value === "" && localValue !== "") setLocalValue("");
  }, [value]);

  const handleChange = (v: string) => {
    setLocalValue(v);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onChange(v), 250);
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search artists in lineup..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10"
      />
      {localValue && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showSort?: boolean;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  resultCount: number;
  countries?: { code: string; name: string }[];
  /** Years present in the dataset. Chips only appear once there is more than one. */
  availableYears?: number[];
}

export function FilterBar({
  filters,
  onFiltersChange,
  showSort = false,
  sortBy = "date",
  onSortChange,
  resultCount,
  countries = DEFAULT_COUNTRIES,
  availableYears = [],
}: FilterBarProps) {
  const COUNTRIES = countries;
  const [isExpanded, setIsExpanded] = useState(false);
  const { genres: globalGenres } = useGlobalGenreFilter();

  // Compute visible sub-genres based on active global genre categories
  const visibleSubGenres = globalGenres.length === 0
    ? []
    : SUB_GENRES.filter(sg => globalGenres.includes(sg.category));

  // Auto-clear selected sub-genres that are no longer visible when the global filter changes
  useEffect(() => {
    const validValues = new Set(visibleSubGenres.map(sg => sg.value));
    const stale = filters.subGenres.filter(g => !validValues.has(g));
    if (stale.length > 0) {
      onFiltersChange({ ...filters, subGenres: filters.subGenres.filter(g => validValues.has(g)) });
    }
  }, [globalGenres]);

  const toggleCountry = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  const toggleSize = (size: FestivalSize) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFiltersChange({ ...filters, sizes: newSizes });
  };

  const toggleSubGenre = (subGenre: string) => {
    const newSubGenres = filters.subGenres.includes(subGenre)
      ? filters.subGenres.filter((g) => g !== subGenre)
      : [...filters.subGenres, subGenre];
    onFiltersChange({ ...filters, subGenres: newSubGenres });
  };

  const handleMonthRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, months: [value[0], value[1]] });
  };

  const toggleYear = (year: number) => {
    const years = filters.years.includes(year)
      ? filters.years.filter((y) => y !== year)
      : [...filters.years, year].sort((a, b) => a - b);
    onFiltersChange({ ...filters, years });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters());
  };

  const activeFilters = activeFilterCount(filters);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-lg"
    >
      {/* Search and Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Lineup Search */}
        <SearchInput
          value={filters.search}
          onChange={(value) => onFiltersChange({ ...filters, search: value })}
        />

        {/* Filter Toggle (Mobile) */}
        <Button
          variant="outline"
          className="md:hidden"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {activeFilters}
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
        {activeFilters > 0 && (
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

      {/* Season (year) chips — only meaningful once the dataset spans more than one year.
          No selection means the rolling window: everything from today forward. */}
      {availableYears.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground mr-1">Season</span>
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, years: [] })}
            aria-pressed={filters.years.length === 0}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filters.years.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            All years
          </button>
          {availableYears.map((year) => {
            const isActive = filters.years.includes(year);
            return (
              <button
                key={year}
                type="button"
                onClick={() => toggleYear(year)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop Filters / Expanded Mobile Filters */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : "0", opacity: isExpanded ? 1 : 0 }}
        className={`md:!h-auto md:!opacity-100 overflow-hidden`}
      >
        <div className="flex flex-wrap gap-6 pt-3 border-t border-border md:pt-4">
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

          {/* Size Filters */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Size</span>
            <div className="flex flex-wrap gap-3">
              {SIZES.map((size) => (
                <label
                  key={size.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.sizes.includes(size.value)}
                    onCheckedChange={() => toggleSize(size.value)}
                  />
                  <span className="text-sm text-foreground">{size.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sub-Genre Filters */}
          {visibleSubGenres.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Sub-Genres</span>
              <div className="flex flex-wrap gap-3">
                {visibleSubGenres.map((subGenre) => (
                  <label
                    key={subGenre.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.subGenres.includes(subGenre.value)}
                      onCheckedChange={() => toggleSubGenre(subGenre.value)}
                    />
                    <span className="text-sm text-foreground">{subGenre.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Month-of-year window. Deliberately year-independent: "every summer",
              not "summer 2026" — narrowing to a season is what the year chips do. */}
          <div className="space-y-3 min-w-[200px] flex-1 max-w-[300px]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Months</span>
              <span className="text-sm text-foreground">
                {MONTH_ABBR[filters.months[0] - 1]} – {MONTH_ABBR[filters.months[1] - 1]}
              </span>
            </div>
            <Slider
              value={filters.months}
              onValueChange={handleMonthRangeChange}
              min={1}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Jan</span>
              <span>Dec</span>
            </div>
          </div>

          {/* Show Past Festivals Toggle */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">More</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.showPast}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showPast: checked === true })
                }
              />
              <span className="text-sm text-foreground">Show past festivals</span>
            </label>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
