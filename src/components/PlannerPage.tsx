"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerTimeline } from "./PlannerTimeline";
import { FestivalDetail } from "./FestivalDetail";
import { FestivalSearch } from "./FestivalSearch";
import { FestivalMap } from "./FestivalMap";
import { useSelectedFestivals } from "@/hooks/useSelectedFestivals";
import type { Festival } from "@/types/festival";

interface PlannerPageProps {
  festivals: Festival[];
}

export function PlannerPage({ festivals }: PlannerPageProps) {
  const { selectedIds, clearAll, count } = useSelectedFestivals();
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const selectedFestivals = useMemo(() => {
    return festivals.filter((f) => selectedIds.includes(f.id));
  }, [festivals, selectedIds]);

  const handleFestivalClick = (festival: Festival) => {
    setSelectedFestival(festival);
    setIsDetailOpen(true);
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (selectedFestivals.length === 0) return null;

    const countries = new Set(selectedFestivals.map((f) => f.country_name));
    const sortedByDate = [...selectedFestivals].sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    );
    const firstDate = new Date(sortedByDate[0].start_date);
    const lastDate = new Date(sortedByDate[sortedByDate.length - 1].end_date);
    const totalDays = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      festivalCount: selectedFestivals.length,
      countryCount: countries.size,
      totalDays,
    };
  }, [selectedFestivals]);

  if (count === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <CalendarDays className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          No Festivals Selected
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Search for festivals below or browse the list to start building your plan.
        </p>
        <FestivalSearch festivals={festivals} className="w-full max-w-md mb-6" />
        <p className="text-sm text-muted-foreground">or</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/list">Browse All Festivals</a>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Festival Plan</h1>
          <p className="text-muted-foreground mt-1">
            {count} {count === 1 ? "festival" : "festivals"} selected
          </p>
        </div>
        <Button
          variant="outline"
          onClick={clearAll}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Search Bar */}
      <FestivalSearch festivals={festivals} className="max-w-md" />

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-3xl font-bold text-primary">{stats.festivalCount}</p>
            <p className="text-sm text-muted-foreground">Festivals</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-3xl font-bold text-secondary">{stats.countryCount}</p>
            <p className="text-sm text-muted-foreground">Countries</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-3xl font-bold text-accent">{stats.totalDays}</p>
            <p className="text-sm text-muted-foreground">Day Span</p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Timeline
        </h2>
        <PlannerTimeline
          festivals={selectedFestivals}
          onFestivalClick={handleFestivalClick}
        />
      </div>

      {/* Map */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Map
        </h2>
        <div className="h-[400px] rounded-2xl overflow-hidden border border-border">
          <FestivalMap
            festivals={selectedFestivals}
            onFestivalClick={handleFestivalClick}
          />
        </div>
      </div>

      {/* Festival Detail Modal */}
      <FestivalDetail
        festival={selectedFestival}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
