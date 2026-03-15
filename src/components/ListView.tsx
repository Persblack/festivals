"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { FilterBar } from "./FilterBar";
import { GenreBadge } from "./GenreBadge";
import { Button } from "@/components/ui/button";
import { formatDateRange, getCountryFlag, formatPriceRange, getUniqueCountries } from "@/lib/utils";
import { genreMatchesCategories } from "@/lib/genre-utils";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival, Filters } from "@/types/festival";
import { Grid3X3, Table, ArrowUp, ExternalLink } from "lucide-react";

interface ListViewProps {
  festivals: Festival[];
}

type ViewMode = "grid" | "table";
type SortOption = "date" | "name" | "country";

const GRID_PAGE_SIZE = 30;
const TABLE_PAGE_SIZE = 50;

export function ListView({ festivals }: ListViewProps) {
  const [filters, setFilters] = useState<Filters>({ genres: [], subGenres: [], countries: [], sizes: [], dateRange: [1, 12], search: "", showPast: false });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
  const { genres: globalGenres } = useGlobalGenreFilter();

  // Get unique countries from festival data
  const countries = useMemo(() => getUniqueCountries(festivals), [festivals]);

  // Handle scroll
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter((festival) => {
      const matchesGlobalGenre = genreMatchesCategories(festival.genres, globalGenres);
      const matchesSubGenre =
        filters.subGenres.length === 0 ||
        festival.genres.some((g) => filters.subGenres.includes(g));
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
      return matchesGlobalGenre && matchesSubGenre && matchesCountry && matchesSize && matchesDateRange && matchesSearch && matchesPast;
    });
  }, [festivals, filters, globalGenres]);

  // Reset visible count when filters or view mode change
  useEffect(() => {
    setVisibleCount(viewMode === "grid" ? GRID_PAGE_SIZE : TABLE_PAGE_SIZE);
  }, [filteredFestivals, viewMode]);

  // Sort festivals
  const sortedFestivals = useMemo(() => {
    const sorted = [...filteredFestivals];
    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "country":
        sorted.sort((a, b) => a.country_name.localeCompare(b.country_name));
        break;
    }
    return sorted;
  }, [filteredFestivals, sortBy]);

  const visibleFestivals = sortedFestivals.slice(0, visibleCount);
  const hasMore = visibleCount < sortedFestivals.length;
  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : TABLE_PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Filters with Sort */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div className="flex-1 min-w-[300px]">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            showSort
            sortBy={sortBy}
            onSortChange={(s) => setSortBy(s as SortOption)}
            resultCount={sortedFestivals.length}
            countries={countries}
          />
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl bg-muted p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-lg"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-lg"
          >
            <Table className="w-4 h-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleFestivals.map((festival, i) => (
                <FestivalCard
                  key={festival.id}
                  festival={festival}
                  onClick={() => setSelectedFestival(festival)}
                  index={i}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={() => setVisibleCount((c) => c + pageSize)}
                >
                  Show More ({sortedFestivals.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Festival
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Genres
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFestivals.map((festival, i) => (
                    <motion.tr
                      key={festival.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedFestival(festival)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{festival.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {formatDateRange(festival.start_date, festival.end_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {getCountryFlag(festival.country_code)} {festival.city},{" "}
                        {festival.country_name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {festival.genres.map((genre) => (
                            <GenreBadge key={genre} genre={genre} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {formatPriceRange(festival.ticket_price_min, festival.ticket_price_max, festival.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a href={festival.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={() => setVisibleCount((c) => c + pageSize)}
                >
                  Show More ({sortedFestivals.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {sortedFestivals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Grid3X3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No festivals found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </motion.div>
      )}

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Festival Detail Modal */}
      {selectedFestival && (
        <FestivalDetail
          festival={selectedFestival}
          open={!!selectedFestival}
          onClose={() => setSelectedFestival(null)}
          allFestivals={festivals}
          onFestivalClick={(f) => setSelectedFestival(f)}
        />
      )}
    </div>
  );
}
