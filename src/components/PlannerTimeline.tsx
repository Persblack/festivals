"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { GenreBadge } from "./GenreBadge";
import { formatDateRange, getCountryFlag } from "@/lib/utils";
import {
  daysBetween,
  formatMonthDay,
  MONTH_ABBR,
  parseLocalDate,
  toDateString,
} from "@/lib/dates";
import type { Festival } from "@/types/festival";

const genreColors: Record<string, { bg: string; border: string; shadow: string; gradient: string }> = {
  EDM: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    shadow: "shadow-blue-500/20 hover:shadow-blue-500/40",
    gradient: "from-blue-600/90 to-blue-500/70",
  },
  Techno: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/40",
    shadow: "shadow-cyan-500/20 hover:shadow-cyan-500/40",
    gradient: "from-cyan-600/90 to-cyan-500/70",
  },
  Rock: {
    bg: "bg-red-500/20",
    border: "border-red-500/40",
    shadow: "shadow-red-500/20 hover:shadow-red-500/40",
    gradient: "from-red-600/90 to-red-500/70",
  },
  Metal: {
    bg: "bg-gray-500/20",
    border: "border-gray-400/40",
    shadow: "shadow-gray-500/20 hover:shadow-gray-400/40",
    gradient: "from-gray-600/90 to-gray-500/70",
  },
  Else: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/40",
    shadow: "shadow-purple-500/20 hover:shadow-purple-500/40",
    gradient: "from-purple-600/90 to-purple-500/70",
  },
};

function getGenreStyle(genres: string[]) {
  return genreColors[genres[0]] || genreColors.Else;
}

interface PlannerTimelineProps {
  festivals: Festival[];
  onFestivalClick: (festival: Festival) => void;
}

/**
 * One marker per month boundary. The label carries the year (`Jul '27`) only
 * when the planner spans more than one calendar year — a planner mixing 2026
 * and 2027 otherwise shows two identical `Jan` markers.
 */
function buildMonthMarkers(
  firstDate: string,
  lastDate: string,
  totalDays: number,
): { label: string; leftPercent: number }[] {
  const start = parseLocalDate(firstDate);
  const end = parseLocalDate(lastDate);
  if (!start || !end) return [];

  const showYear = start.getFullYear() !== end.getFullYear();
  const markers: { label: string; leftPercent: number }[] = [];

  // Start from the first day of the month of the first festival
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const dayOffset = daysBetween(firstDate, toDateString(current));
    const leftPercent = Math.max(0, (dayOffset / totalDays) * 100);

    if (leftPercent <= 100) {
      const month = MONTH_ABBR[current.getMonth()];
      markers.push({
        label: showYear ? `${month} '${String(current.getFullYear()).slice(-2)}` : month,
        leftPercent,
      });
    }

    current.setMonth(current.getMonth() + 1);
  }

  return markers;
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

    const totalDays = daysBetween(firstDate, lastDate) + 1; // +1 to include both start and end days
    const rowAssignments = assignRows(sorted);
    const maxRow = Math.max(...Array.from(rowAssignments.values())) + 1;

    return {
      festivals: sorted,
      firstDate,
      lastDate,
      totalDays,
      rowAssignments,
      maxRow,
      // Folded in here on purpose: as its own useMemo below the early return
      // it was a conditional hook, and the hook order broke whenever the
      // planner went from populated to empty.
      monthMarkers: buildMonthMarkers(firstDate, lastDate, totalDays),
    };
  }, [festivals]);

  if (!timelineData) {
    return null;
  }

  const { firstDate, lastDate, totalDays, rowAssignments, maxRow, monthMarkers } = timelineData;

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
          style={{ height: `${maxRow * 100 + 20}px` }}
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
            const dayOffset = daysBetween(firstDate, festival.start_date);
            const duration = daysBetween(festival.start_date, festival.end_date) + 1;
            const leftPercent = (dayOffset / totalDays) * 100;
            const widthPercent = Math.max((duration / totalDays) * 100, 3); // Min 3% width for visibility
            const row = rowAssignments.get(festival.id) || 0;
            const style = getGenreStyle(festival.genres);

            return (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                onClick={() => onFestivalClick(festival)}
                className="absolute cursor-pointer group"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: `${row * 100 + 10}px`,
                  minWidth: "130px",
                }}
              >
                <div className={`h-[84px] rounded-2xl bg-gradient-to-r ${style.gradient} border ${style.border} shadow-lg ${style.shadow} backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 hover:z-10 overflow-hidden`}>
                  <div className="px-3 py-2.5 h-full flex flex-col justify-center gap-1">
                    <p className="text-sm font-bold text-white truncate drop-shadow-sm">
                      {festival.name}
                    </p>
                    <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {getCountryFlag(festival.country_code)} {festival.city}
                    </p>
                    <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatMonthDay(festival.start_date)}–{formatMonthDay(festival.end_date)}
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
          .map((festival, index) => {
            const style = getGenreStyle(festival.genres);
            return (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ y: -2 }}
                onClick={() => onFestivalClick(festival)}
                className={`relative p-4 rounded-2xl bg-card border ${style.border} cursor-pointer shadow-lg ${style.shadow} transition-all duration-200 overflow-hidden`}
              >
                {/* Subtle genre accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.gradient}`} />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate">
                      {festival.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {getCountryFlag(festival.country_code)} {festival.city}, {festival.country_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDateRange(festival.start_date, festival.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {festival.genres.slice(0, 2).map((genre) => (
                      <GenreBadge key={genre} genre={genre} />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
