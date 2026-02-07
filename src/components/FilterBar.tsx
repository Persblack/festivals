"use client";

import { useState } from "react";
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
import type { FestivalSize, Filters } from "@/types/festival";

const SIZES: { value: FestivalSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DEFAULT_COUNTRIES = [
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
];

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showSort?: boolean;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  resultCount: number;
  countries?: { code: string; name: string }[];
}

export function FilterBar({
  filters,
  onFiltersChange,
  showSort = false,
  sortBy = "date",
  onSortChange,
  resultCount,
  countries = DEFAULT_COUNTRIES,
}: FilterBarProps) {
  const COUNTRIES = countries;
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleDateRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, dateRange: [value[0], value[1]] });
  };

  const clearFilters = () => {
    onFiltersChange({ genres: [], countries: [], sizes: [], dateRange: [1, 12], search: "" });
  };

  const isDateRangeFiltered = filters.dateRange[0] !== 1 || filters.dateRange[1] !== 12;
  const activeFilterCount =
    filters.countries.length +
    filters.sizes.length +
    (isDateRangeFiltered ? 1 : 0) +
    (filters.search ? 1 : 0);

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

          {/* Date Range Filter */}
          <div className="space-y-3 min-w-[200px] flex-1 max-w-[300px]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Date Range</span>
              <span className="text-sm text-foreground">
                {MONTHS[filters.dateRange[0] - 1]} – {MONTHS[filters.dateRange[1] - 1]}
              </span>
            </div>
            <Slider
              value={filters.dateRange}
              onValueChange={handleDateRangeChange}
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
        </div>
      </motion.div>
    </motion.div>
  );
}
