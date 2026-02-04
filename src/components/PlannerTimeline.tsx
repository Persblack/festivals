"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { GenreBadge } from "./GenreBadge";
import { formatDateRange, getCountryFlag } from "@/lib/utils";
import type { Festival } from "@/types/festival";

interface PlannerTimelineProps {
  festivals: Festival[];
  onFestivalClick: (festival: Festival) => void;
}

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonthDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Check if two festivals overlap
function festivalsOverlap(a: Festival, b: Festival): boolean {
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

// Assign rows to festivals to handle overlaps
function assignRows(festivals: Festival[]): Map<string, number> {
  const sorted = [...festivals].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const rowAssignments = new Map<string, number>();
  const rows: Festival[][] = [];

  for (const festival of sorted) {
    let assignedRow = -1;

    // Find the first row where this festival doesn't overlap with any existing
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const canFit = rows[rowIndex].every((f) => !festivalsOverlap(f, festival));
      if (canFit) {
        assignedRow = rowIndex;
        break;
      }
    }

    // If no row found, create a new one
    if (assignedRow === -1) {
      assignedRow = rows.length;
      rows.push([]);
    }

    rows[assignedRow].push(festival);
    rowAssignments.set(festival.id, assignedRow);
  }

  return rowAssignments;
}

export function PlannerTimeline({ festivals, onFestivalClick }: PlannerTimelineProps) {
  const timelineData = useMemo(() => {
    if (festivals.length === 0) return null;

    // Sort by start date
    const sorted = [...festivals].sort((a, b) => a.start_date.localeCompare(b.start_date));

    // Get timeline range - from first start to last end
    const firstDate = sorted[0].start_date;
    const lastDate = sorted.reduce((max, f) => (f.end_date > max ? f.end_date : max), sorted[0].end_date);

    const totalDays = getDaysBetween(firstDate, lastDate) + 1; // +1 to include both start and end days
    const rowAssignments = assignRows(sorted);
    const maxRow = Math.max(...Array.from(rowAssignments.values())) + 1;

    return {
      festivals: sorted,
      firstDate,
      lastDate,
      totalDays,
      rowAssignments,
      maxRow,
    };
  }, [festivals]);

  if (!timelineData || festivals.length === 0) {
    return null;
  }

  const { firstDate, lastDate, totalDays, rowAssignments, maxRow } = timelineData;

  // Generate month markers for the timeline header
  const monthMarkers = useMemo(() => {
    const markers: { label: string; leftPercent: number }[] = [];
    const start = new Date(firstDate);
    const end = new Date(lastDate);

    // Start from the first day of the month of the first festival
    const current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const dayOffset = getDaysBetween(firstDate, current.toISOString().split('T')[0]);
      const leftPercent = Math.max(0, (dayOffset / totalDays) * 100);

      if (leftPercent >= 0 && leftPercent <= 100) {
        markers.push({
          label: current.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          leftPercent,
        });
      }

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  }, [firstDate, lastDate, totalDays]);

  return (
    <div className="space-y-4">
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        {/* Timeline header with date range */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>{formatMonthDay(firstDate)}</span>
          <span className="text-foreground font-medium">{totalDays} days</span>
          <span>{formatMonthDay(lastDate)}</span>
        </div>

        {/* Month markers */}
        <div className="relative h-8 mb-2">
          {monthMarkers.map((marker, i) => (
            <div
              key={i}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${marker.leftPercent}%` }}
            >
              <div className="w-px h-4 bg-border mb-1" />
              <span className="whitespace-nowrap">{marker.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div
          className="relative bg-muted/50 rounded-xl border border-border overflow-hidden"
          style={{ height: `${maxRow * 70 + 20}px` }}
        >
          {/* Background grid lines */}
          <div className="absolute inset-0 flex">
            {monthMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-border/50"
                style={{ left: `${marker.leftPercent}%` }}
              />
            ))}
          </div>

          {/* Festival blocks */}
          {festivals.map((festival, index) => {
            const dayOffset = getDaysBetween(firstDate, festival.start_date);
            const duration = getDaysBetween(festival.start_date, festival.end_date) + 1;
            const leftPercent = (dayOffset / totalDays) * 100;
            const widthPercent = Math.max((duration / totalDays) * 100, 3); // Min 3% width for visibility
            const row = rowAssignments.get(festival.id) || 0;

            return (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onFestivalClick(festival)}
                className="absolute cursor-pointer group"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: `${row * 70 + 10}px`,
                  minWidth: "100px",
                }}
              >
                <div className="h-14 rounded-xl bg-gradient-to-r from-primary/80 to-primary border border-primary/50 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] hover:z-10 overflow-hidden">
                  <div className="p-2 h-full flex flex-col justify-center">
                    <p className="text-xs font-semibold text-white truncate">
                      {festival.name}
                    </p>
                    <p className="text-[10px] text-white/70 truncate">
                      {getCountryFlag(festival.country_code)} {festival.city} · {formatMonthDay(festival.start_date)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {festivals
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
          .map((festival, index) => (
            <motion.div
              key={festival.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onFestivalClick(festival)}
              className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {festival.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getCountryFlag(festival.country_code)} {festival.city}, {festival.country_name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange(festival.start_date, festival.end_date)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {festival.genres.slice(0, 2).map((genre) => (
                    <GenreBadge key={genre} genre={genre} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
