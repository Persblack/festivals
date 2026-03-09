import { useState, useMemo } from "react";
import { getUniqueCountries } from "@/lib/utils";
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
  const [filters, setFilters] = useState<Filters>({ genres: [], countries: [], sizes: [], dateRange: [1, 12], search: "", showPast: false });
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const { genres: globalGenres } = useGlobalGenreFilter();

  // Get unique countries from festival data
  const countries = useMemo(() => getUniqueCountries(festivals), [festivals]);

  // Filter festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter((festival) => {
      const matchesGlobalGenre =
        globalGenres.length === 0 ||
        festival.genres.some((g) => globalGenres.includes(g));
      const matchesCountry =
        filters.countries.length === 0 ||
        filters.countries.includes(festival.country_code);
      const matchesSize =
        filters.sizes.length === 0 ||
        filters.sizes.includes(festival.size === "massive" ? "large" : festival.size);
      const festivalMonth = new Date(festival.start_date).getMonth() + 1;
      const matchesDateRange =
        festivalMonth >= filters.dateRange[0] && festivalMonth <= filters.dateRange[1];
      const matchesSearch =
        !filters.search ||
        festival.lineup?.some((artist) =>
          artist.toLowerCase().includes(filters.search.toLowerCase())
        ) ||
        festival.name.toLowerCase().includes(filters.search.toLowerCase());
      const isPast = new Date() > new Date(festival.end_date);
      const matchesPast = filters.showPast || !isPast;
      return matchesGlobalGenre && matchesCountry && matchesSize && matchesDateRange && matchesSearch && matchesPast;
    });
  }, [festivals, filters, globalGenres]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredFestivals.length}
        countries={countries}
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
