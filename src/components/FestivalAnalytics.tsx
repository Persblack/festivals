"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import type { Festival } from "@/types/festival";
import { getGenreColorHex, getCountryFlag } from "@/lib/utils";
import { MONTH_ABBR, formatYearRange, monthOf, yearOf } from "@/lib/dates";
import { availableYears } from "@/lib/filters";

const EXTENDED_GENRE_COLORS: Record<string, string> = {
  EDM: "#3B82F6",
  Techno: "#06B6D4",
  Rock: "#EF4444",
  Metal: "#9CA3AF",
  Else: "#A855F7",
  Pop: "#F59E0B",
  "Hip-Hop": "#22C55E",
  Folk: "#F97316",
  Jazz: "#8B5CF6",
  Punk: "#FB7185",
  Reggae: "#4ADE80",
  Hardcore: "#EC4899",
  Classical: "#C4B5FD",
};

const SIZE_COLORS: Record<string, string> = {
  small: "#06B6D4",
  medium: "#3B82F6",
  large: "#A855F7",
  massive: "#EF4444",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  massive: "Massive",
};

/**
 * One accent per season, drawn from the palette the other charts already use.
 * Index 0 is the timeline blue, so a single-year dataset looks exactly as before.
 */
const SERIES_COLORS = ["#3B82F6", "#A855F7", "#06B6D4", "#F59E0B", "#22C55E", "#EF4444"];

const tooltipStyle = {
  backgroundColor: "#1C1C1C",
  border: "1px solid #333",
  borderRadius: "12px",
  color: "#FAFAFA",
};

const tooltipItemStyle = { color: "#FAFAFA" };
const tooltipLabelStyle = { color: "#FAFAFA", fontWeight: "bold" as const };

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

export function FestivalAnalytics({ festivals }: { festivals: Festival[] }) {
  const years = useMemo(() => availableYears(festivals), [festivals]);

  /**
   * Twelve month-of-year buckets per season. Comparing the same month across
   * years is the useful reading, so the seasons overlay rather than extending
   * the axis to 24 chronological ticks.
   */
  const seasonChart = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    for (const year of years) buckets[year] = Array.from({ length: 12 }, () => 0);

    for (const festival of festivals) {
      const year = yearOf(festival.start_date);
      const month = monthOf(festival.start_date);
      if (year === null || month === null) continue;
      const bucket = buckets[year];
      if (bucket) bucket[month] += 1;
    }

    const series = years.map((year, i) => ({
      key: String(year),
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }));

    const data = MONTH_ABBR.map((month, i) => {
      const row: Record<string, string | number> = { month };
      for (const entry of series) row[entry.key] = buckets[entry.key]?.[i] ?? 0;
      return row;
    });

    return { data, series };
  }, [festivals, years]);

  const isMultiYear = years.length > 1;
  const yearSpan = formatYearRange(years);
  // These charts cover the whole dataset, past festivals included — a season
  // histogram cut off at today would read as empty for every month behind us.
  const seasonSpan = yearSpan === "" ? "" : `, ${yearSpan}`;

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    festivals.forEach((f) =>
      f.genres.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }, [festivals]);

  const countryData = useMemo(() => {
    const counts: Record<string, { name: string; code: string; count: number }> = {};
    festivals.forEach((f) => {
      if (!counts[f.country_code]) {
        counts[f.country_code] = { name: f.country_name, code: f.country_code, count: 0 };
      }
      counts[f.country_code].count++;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [festivals]);

  const artistGenreData = useMemo(() => {
    const artistsByGenre: Record<string, Set<string>> = {};
    festivals.forEach((f) => {
      if (!f.lineup || f.lineup.length === 0) return;
      f.genres.forEach((g) => {
        if (!artistsByGenre[g]) artistsByGenre[g] = new Set();
        f.lineup.forEach((a) => artistsByGenre[g].add(a));
      });
    });
    return Object.entries(artistsByGenre)
      .map(([genre, artists]) => ({ genre, count: artists.size }))
      .sort((a, b) => b.count - a.count);
  }, [festivals]);

  const sizeData = useMemo(() => {
    const counts: Record<string, number> = {};
    festivals.forEach((f) => {
      counts[f.size] = (counts[f.size] || 0) + 1;
    });
    return ["small", "medium", "large", "massive"]
      .filter((s) => counts[s])
      .map((size) => ({
        size,
        label: SIZE_LABELS[size],
        count: counts[size],
      }));
  }, [festivals]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Festival Season at a Glance
        </h2>
        <p className="text-muted-foreground">
          Data-driven insights across all {festivals.length} festivals{seasonSpan}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Festival Season Timeline */}
        <motion.div
          className="rounded-2xl bg-card border border-border/50 p-6"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Festival Season Timeline
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonChart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {seasonChart.series.map((series) => (
                    <linearGradient
                      key={series.key}
                      id={`timelineGradient-${series.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={series.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [
                    `${value} festivals`,
                    isMultiYear ? name : "Count",
                  ]}
                />
                {seasonChart.series.map((series) => (
                  <Area
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.key}
                    stroke={series.color}
                    strokeWidth={3}
                    fill={`url(#timelineGradient-${series.key})`}
                    dot={{ fill: series.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {isMultiYear && (
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {seasonChart.series.map((series) => (
                <div key={series.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="text-muted-foreground">{series.key}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Chart 2: Genre Breakdown */}
        <motion.div
          className="rounded-2xl bg-card border border-border/50 p-6"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Genre Breakdown
          </h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genreData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="genre"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={85}
                  interval={0}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number) => [`${value} festivals`, "Count"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {genreData.map((entry) => (
                    <Cell
                      key={entry.genre}
                      fill={EXTENDED_GENRE_COLORS[entry.genre] || getGenreColorHex(entry.genre)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 3: Top 10 Countries */}
        <motion.div
          className="rounded-2xl bg-card border border-border/50 p-6"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={2}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Top 10 Countries
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <defs>
                  <linearGradient id="countryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tickFormatter={(name: string) => {
                    const entry = countryData.find((c) => c.name === name);
                    const flag = entry ? getCountryFlag(entry.code) : "";
                    return `${flag} ${name}`;
                  }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number) => [`${value} festivals`, "Count"]}
                />
                <Bar dataKey="count" fill="url(#countryGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 4: Artists per Genre */}
        <motion.div
          className="rounded-2xl bg-card border border-border/50 p-6"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={3}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Artists per Genre
          </h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={artistGenreData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="genre"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={85}
                  interval={0}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number) => [
                    `${value.toLocaleString()} unique artists`,
                    "Artists",
                  ]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {artistGenreData.map((entry) => (
                    <Cell
                      key={entry.genre}
                      fill={EXTENDED_GENRE_COLORS[entry.genre] || getGenreColorHex(entry.genre)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 5: Festival Sizes */}
        <motion.div
          className="rounded-2xl bg-card border border-border/50 p-6 md:col-span-2 md:max-w-md md:mx-auto"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={4}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Festival Sizes
          </h3>
          <div className="flex flex-col items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sizeData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {sizeData.map((entry) => (
                      <Cell key={entry.size} fill={SIZE_COLORS[entry.size]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    formatter={(value: number, name: string) => [
                      `${value} festivals (${Math.round((value / festivals.length) * 100)}%)`,
                      name,
                    ]}
                  />
                  <text
                    x="50%"
                    y="46%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold"
                  >
                    {festivals.length}
                  </text>
                  <text
                    x="50%"
                    y="57%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {sizeData.map((entry) => (
                <div key={entry.size} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: SIZE_COLORS[entry.size] }}
                  />
                  <span className="text-muted-foreground">
                    {entry.label} ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
