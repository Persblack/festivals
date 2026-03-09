"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { Button } from "@/components/ui/button";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import { genreMatchesCategories } from "@/lib/genre-utils";
import { ChevronDown } from "lucide-react";
import type { Festival } from "@/types/festival";

const INITIAL_ROWS = 3;
const COLS_LG = 4;
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG;

interface FeaturedFestivalsProps {
  festivals: Festival[];
}

export function FeaturedFestivals({ festivals }: FeaturedFestivalsProps) {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { genres: globalGenres } = useGlobalGenreFilter();

  const filteredFestivals = useMemo(() => {
    const now = new Date();
    return festivals.filter((f) => {
      const isPast = now > new Date(f.end_date);
      if (isPast) return false;
      return genreMatchesCategories(f.genres, globalGenres);
    });
  }, [festivals, globalGenres]);

  const hasMore = filteredFestivals.length > INITIAL_COUNT;
  const visibleFestivals = showAll ? filteredFestivals : filteredFestivals.slice(0, INITIAL_COUNT);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence initial={false}>
          {visibleFestivals.map((festival, index) => (
            <motion.div
              key={festival.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index >= INITIAL_COUNT ? (index - INITIAL_COUNT) * 0.05 : 0 }}
            >
              <FestivalCard
                festival={festival}
                onClick={() => setSelectedFestival(festival)}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAll(!showAll)}
            className="rounded-full px-8"
          >
            {showAll ? "Show less" : `Show ${filteredFestivals.length - INITIAL_COUNT} more`}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </Button>
        </div>
      )}

      <FestivalDetail
        festival={selectedFestival}
        open={selectedFestival !== null}
        onClose={() => setSelectedFestival(null)}
        allFestivals={festivals}
        onFestivalClick={(f) => setSelectedFestival(f)}
      />
    </>
  );
}
