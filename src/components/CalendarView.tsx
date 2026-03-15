import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { FilterBar } from "./FilterBar";
import { Button } from "@/components/ui/button";
import { getMonthName, getUniqueCountries } from "@/lib/utils";
import { genreMatchesCategories } from "@/lib/genre-utils";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival, Filters } from "@/types/festival";
import { Calendar } from "lucide-react";

const MONTH_INITIAL_COUNT = 12;
const MONTH_LOAD_MORE = 12;

interface CalendarViewProps {
  festivals: Festival[];
}

export function CalendarView({ festivals }: CalendarViewProps) {
  const [filters, setFilters] = useState<Filters>({ genres: [], subGenres: [], countries: [], sizes: [], dateRange: [new Date().getMonth() + 1, 12], search: "", showPast: false });
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<number, number>>({});
  const { genres: globalGenres } = useGlobalGenreFilter();

  const getMonthVisibleCount = useCallback((month: number) => {
    return expandedMonths[month] ?? MONTH_INITIAL_COUNT;
  }, [expandedMonths]);

  const showMoreInMonth = useCallback((month: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: (prev[month] ?? MONTH_INITIAL_COUNT) + MONTH_LOAD_MORE,
    }));
  }, []);

  // Get unique countries from festival data
  const countries = useMemo(() => getUniqueCountries(festivals), [festivals]);

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

  // Group festivals by month
  const festivalsByMonth = useMemo(() => {
    const grouped = new Map<number, Festival[]>();

    filteredFestivals.forEach((festival) => {
      const month = new Date(festival.start_date).getMonth();
      if (!grouped.has(month)) {
        grouped.set(month, []);
      }
      grouped.get(month)!.push(festival);
    });

    // Sort festivals within each month
    grouped.forEach((festivals) => {
      festivals.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });

    // Return sorted entries
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [filteredFestivals]);

  const monthsWithFestivals = festivalsByMonth.map(([month]) => month);

  const scrollToMonth = (month: number) => {
    const element = document.getElementById(`month-${month}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredFestivals.length}
        countries={countries}
      />

      {/* Quick Jump Navigation */}
      {monthsWithFestivals.length > 2 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Jump to:</span>
          {monthsWithFestivals.map((month) => (
            <button
              key={month}
              onClick={() => scrollToMonth(month)}
              className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {getMonthName(month)}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-12">
        {festivalsByMonth.map(([month, monthFestivals], index) => {
          const monthVisible = getMonthVisibleCount(month);
          const visibleInMonth = monthFestivals.slice(0, monthVisible);
          const hasMoreInMonth = monthVisible < monthFestivals.length;

          return (
            <motion.section
              key={month}
              id={`month-${month}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
              className="scroll-mt-24"
            >
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {getMonthName(month)} 2026
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {monthFestivals.length} festival{monthFestivals.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Festival Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleInMonth.map((festival, i) => (
                  <FestivalCard
                    key={festival.id}
                    festival={festival}
                    onClick={() => setSelectedFestival(festival)}
                    index={i}
                  />
                ))}
              </div>
              {hasMoreInMonth && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => showMoreInMonth(month)}
                  >
                    Show more in {getMonthName(month)} ({monthFestivals.length - monthVisible} remaining)
                  </Button>
                </div>
              )}
            </motion.section>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredFestivals.length === 0 && (
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
