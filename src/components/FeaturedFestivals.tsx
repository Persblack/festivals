"use client";

import { useState, useMemo } from "react";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival } from "@/types/festival";

interface FeaturedFestivalsProps {
  festivals: Festival[];
}

export function FeaturedFestivals({ festivals }: FeaturedFestivalsProps) {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const { genres: globalGenres } = useGlobalGenreFilter();

  const filteredFestivals = useMemo(() => {
    if (globalGenres.length === 0) return festivals;
    return festivals.filter((f) =>
      f.genres.some((g) => globalGenres.includes(g))
    );
  }, [festivals, globalGenres]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredFestivals.map((festival, index) => (
          <FestivalCard
            key={festival.id}
            festival={festival}
            onClick={() => setSelectedFestival(festival)}
            index={index}
          />
        ))}
      </div>

      <FestivalDetail
        festival={selectedFestival}
        open={selectedFestival !== null}
        onClose={() => setSelectedFestival(null)}
      />
    </>
  );
}
