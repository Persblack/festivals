import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { FilterBar } from "./FilterBar";
import { Button } from "@/components/ui/button";
import { getUniqueCountries } from "@/lib/utils";
import {
  applyFilters,
  availableYears,
  buildSearchIndex,
  defaultFilters,
  groupByMonth,
} from "@/lib/filters";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival, Filters } from "@/types/festival";
import { Calendar } from "lucide-react";

const MONTH_INITIAL_COUNT = 12;
const MONTH_LOAD_MORE = 12;

interface CalendarViewProps {
  festivals: Festival[];
}

export function CalendarView({ festivals }: CalendarViewProps) {
  // Rolling window: no month or year narrowing, just "not over yet". The old
  // default started the month slider at the current month, which hid January of
  // the following season every December.
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  // Keyed by `YYYY-MM`, not by month index — two seasons expand independently.
  const [expandedMonths, setExpandedMonths] = useState<Record<string, number>>({});
  const { genres: globalGenres } = useGlobalGenreFilter();

  const showMoreInMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: (prev[key] ?? MONTH_INITIAL_COUNT) + MONTH_LOAD_MORE,
    }));
  }, []);

  const countries = useMemo(() => getUniqueCountries(festivals), [festivals]);
  const years = useMemo(() => availableYears(festivals), [festivals]);
  const searchIndex = useMemo(() => buildSearchIndex(festivals), [festivals]);

  const filteredFestivals = useMemo(
    () => applyFilters(festivals, filters, globalGenres, { searchIndex }),
    [festivals, filters, globalGenres, searchIndex],
  );

  // Grouped by year AND month: grouping by month alone merges July 2026 into
  // July 2027 the moment a second season is in the dataset.
  const monthGroups = useMemo(() => groupByMonth(filteredFestivals), [filteredFestivals]);
  const spansMultipleYears = new Set(monthGroups.map((group) => group.year)).size > 1;

  const scrollToMonth = (key: string) => {
    document.getElementById(`month-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

      {/* Quick Jump Navigation — year-qualified once more than one season is loaded,
          otherwise two identical "Jan" chips would scroll to different places. */}
      {monthGroups.length > 2 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Jump to:</span>
          {monthGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => scrollToMonth(group.key)}
              className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {spansMultipleYears ? group.shortLabel : group.label.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-12">
        {monthGroups.map((group, index) => {
          const monthVisible = expandedMonths[group.key] ?? MONTH_INITIAL_COUNT;
          const monthFestivals = group.festivals;
          const visibleInMonth = monthFestivals.slice(0, monthVisible);
          const hasMoreInMonth = monthVisible < monthFestivals.length;

          return (
            <motion.section
              key={group.key}
              id={`month-${group.key}`}
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
                      {group.label}
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
                    onClick={() => showMoreInMonth(group.key)}
                  >
                    Show more in {group.label} ({monthFestivals.length - monthVisible} remaining)
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
            {!filters.showPast && festivals.length > 0
              ? "Every festival in the current selection has already happened — enable “Show past festivals” or widen your filters."
              : "Try adjusting your filters to see more results."}
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
