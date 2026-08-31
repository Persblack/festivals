"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FestivalDetail } from "./FestivalDetail";
import { FilterBar } from "./FilterBar";
import { PlannerTimeline } from "./PlannerTimeline";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import {
  applyFilters,
  availableYears,
  buildSearchIndex,
  defaultFilters,
} from "@/lib/filters";
import type { Festival, Filters } from "@/types/festival";
import { Calendar } from "lucide-react";

interface TimelineViewProps {
  festivals: Festival[];
}

export function TimelineView({ festivals }: TimelineViewProps) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const { genres: globalGenres } = useGlobalGenreFilter();

  // One lowercased haystack per festival, rebuilt only when the dataset changes.
  const searchIndex = useMemo(() => buildSearchIndex(festivals), [festivals]);

  // Seasons present in the data — drives the year chips in the filter bar.
  const years = useMemo(() => availableYears(festivals), [festivals]);

  // Filter festivals
  const filteredFestivals = useMemo(
    () => applyFilters(festivals, filters, globalGenres, { searchIndex }),
    [festivals, filters, globalGenres, searchIndex],
  );

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
        availableYears={years}
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
