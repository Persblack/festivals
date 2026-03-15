"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, ArrowUp, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArtistCard } from "./ArtistCard";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import { genreMatchesCategories } from "@/lib/genre-utils";
import type { Festival, Artist } from "@/types/festival";

interface ArtistsPageProps {
  festivals: Festival[];
}

type SortOption = "festivals" | "name";

export function ArtistsPage({ festivals }: ArtistsPageProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("festivals");
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { genres: globalGenres } = useGlobalGenreFilter();

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Derive artists from festival lineups, applying global genre filter
  const artists = useMemo(() => {
    const filtered = festivals.filter((f) => genreMatchesCategories(f.genres, globalGenres));

    const artistMap = new Map<string, { festivals: Festival[]; genres: Set<string> }>();

    for (const festival of filtered) {
      if (!festival.lineup) continue;
      for (const artistName of festival.lineup) {
        const existing = artistMap.get(artistName);
        if (existing) {
          existing.festivals.push(festival);
          festival.genres.forEach((g) => existing.genres.add(g));
        } else {
          artistMap.set(artistName, {
            festivals: [festival],
            genres: new Set(festival.genres),
          });
        }
      }
    }

    const result: Artist[] = [];
    for (const [name, data] of artistMap) {
      result.push({
        name,
        festivalCount: data.festivals.length,
        festivals: data.festivals,
        genres: Array.from(data.genres),
      });
    }

    return result;
  }, [festivals, globalGenres]);

  // Filter by search
  const filteredArtists = useMemo(() => {
    if (!search) return artists;
    const q = search.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, search]);

  // Sort
  const sortedArtists = useMemo(() => {
    const sorted = [...filteredArtists];
    if (sortBy === "festivals") {
      sorted.sort((a, b) => b.festivalCount - a.festivalCount || a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [filteredArtists, sortBy]);

  // Top 6 artists by festival count (shown when no search active)
  const topArtists = useMemo(() => {
    return [...artists]
      .sort((a, b) => b.festivalCount - a.festivalCount || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [artists]);

  const handleToggle = (name: string) => {
    setExpandedArtist((prev) => (prev === name ? null : name));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Search + Sort + Count */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="festivals">Most Festivals</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {sortedArtists.length} artist{sortedArtists.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Top Artists (only when no search) */}
      {!search && topArtists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Artists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topArtists.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setSearch("");
                  setExpandedArtist(artist.name);
                  // Scroll to the artist card after a short delay
                  setTimeout(() => {
                    const el = document.getElementById(`artist-${artist.name}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                className="relative cursor-pointer rounded-xl bg-card border border-border/50 p-4 text-center hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 hover:-translate-y-1"
              >
                <span className="absolute top-2 left-2 text-xs font-bold text-primary">
                  #{i + 1}
                </span>
                <p className="font-semibold text-foreground text-sm mt-2 line-clamp-2">
                  {artist.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {artist.festivalCount} festival{artist.festivalCount !== 1 ? "s" : ""}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Artist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="sync">
          {sortedArtists.map((artist, i) => (
            <motion.div
              key={artist.name}
              id={`artist-${artist.name}`}
              className={expandedArtist === artist.name ? "col-span-full" : ""}
            >
              {expandedArtist === artist.name ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card border border-border/50 p-6 space-y-6"
                >
                  {/* Expanded Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleToggle(artist.name)}
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {artist.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Performing at {artist.festivalCount} festival
                        {artist.festivalCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-sm text-primary hover:underline">
                      Collapse
                    </span>
                  </div>

                  {/* Festival Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artist.festivals.map((festival, fi) => (
                      <FestivalCard
                        key={festival.id}
                        festival={festival}
                        onClick={() => setSelectedFestival(festival)}
                        index={fi}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <ArtistCard
                  name={artist.name}
                  festivalCount={artist.festivalCount}
                  genres={artist.genres}
                  isExpanded={false}
                  onToggle={() => handleToggle(artist.name)}
                  index={i}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedArtists.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No artists found
          </h3>
          <p className="text-muted-foreground">
            {search
              ? "Try a different search term."
              : "No lineup data available for the selected genres."}
          </p>
        </motion.div>
      )}

      {/* Scroll to Top */}
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
      <FestivalDetail
        festival={selectedFestival}
        open={!!selectedFestival}
        onClose={() => setSelectedFestival(null)}
      />
    </div>
  );
}
