"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FestivalDetail } from "./FestivalDetail";
import { FilterBar } from "./FilterBar";
import { PlannerTimeline } from "./PlannerTimeline";
import type { Festival, Filters } from "@/types/festival";
import { Calendar } from "lucide-react";

interface TimelineViewProps {
  festivals: Festival[];
}

export function TimelineView({ festivals }: TimelineViewProps) {
  const [filters, setFilters] = useState<Filters>({ genres: [], countries: [], sizes: [], dateRange: [1, 12], search: "" });
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
      return matchesGenre && matchesCountry && matchesSize && matchesDateRange && matchesSearch;
    });
  }, [festivals, filters]);

  const handleFestivalClick = (festival: Festival) => {
    setSelectedFestival(festival);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredFestivals.length}
      />

      {/* Timeline */}
      {filteredFestivals.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Festival Timeline</h2>
          </div>
          <PlannerTimeline
            festivals={filteredFestivals}
            onFestivalClick={handleFestivalClick}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No festivals found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </motion.div>
      )}

      {/* Festival Detail Modal */}
      <FestivalDetail
        festival={selectedFestival}
        open={!!selectedFestival}
        onClose={() => setSelectedFestival(null)}
      />
    </div>
  );
}
