import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FilterBar } from "./FilterBar";
import { FestivalDetail } from "./FestivalDetail";
import { FestivalMap } from "./FestivalMap";
import type { Festival, Filters } from "@/types/festival";

interface MapPageProps {
  festivals: Festival[];
}

export function MapPage({ festivals }: MapPageProps) {
  const [filters, setFilters] = useState<Filters>({ genres: [], countries: [], search: "" });
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  // Filter festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter((festival) => {
      const matchesGenre =
        filters.genres.length === 0 ||
        festival.genres.some((g) => filters.genres.includes(g));
      const matchesCountry =
        filters.countries.length === 0 ||
        filters.countries.includes(festival.country_code);
      const matchesSearch =
        !filters.search ||
        festival.lineup?.some((artist) =>
          artist.toLowerCase().includes(filters.search.toLowerCase())
        ) ||
        festival.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchesGenre && matchesCountry && matchesSearch;
    });
  }, [festivals, filters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredFestivals.length}
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
      />
    </div>
  );
}
