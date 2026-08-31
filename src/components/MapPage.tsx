import { useState, useMemo } from "react";
import { getUniqueCountries } from "@/lib/utils";
import {
  applyFilters,
  availableYears,
  buildSearchIndex,
  defaultFilters,
} from "@/lib/filters";
import { motion } from "framer-motion";
import { FilterBar } from "./FilterBar";
import { FestivalDetail } from "./FestivalDetail";
import { FestivalMap } from "./FestivalMap";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival, Filters } from "@/types/festival";

interface MapPageProps {
  festivals: Festival[];
}

export function MapPage({ festivals }: MapPageProps) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const { genres: globalGenres } = useGlobalGenreFilter();

  // Get unique countries from festival data
  const countries = useMemo(() => getUniqueCountries(festivals), [festivals]);

  // One lowercased haystack per festival, rebuilt only when the dataset changes.
  const searchIndex = useMemo(() => buildSearchIndex(festivals), [festivals]);

  // Seasons present in the data — drives the year chips in the filter bar.
  const years = useMemo(() => availableYears(festivals), [festivals]);

  // Filter festivals
  const filteredFestivals = useMemo(
    () => applyFilters(festivals, filters, globalGenres, { searchIndex }),
    [festivals, filters, globalGenres, searchIndex],
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredFestivals.length}
        countries={countries}
        availableYears={years}
      />

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-280px)] min-h-[500px] rounded-2xl overflow-hidden border border-border"
      >
        <FestivalMap
          festivals={filteredFestivals}
          onFestivalClick={setSelectedFestival}
        />
      </motion.div>

      {/* Festival Detail Modal */}
      <FestivalDetail
        festival={selectedFestival}
        open={!!selectedFestival}
        onClose={() => setSelectedFestival(null)}
        allFestivals={festivals}
        onFestivalClick={(f) => setSelectedFestival(f)}
      />
    </div>
  );
}
