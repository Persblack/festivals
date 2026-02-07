"use client";

import { useState, useMemo } from "react";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import type { Festival } from "@/types/festival";

interface ThisWeekFestivalsProps {
  festivals: Festival[];
}

export function ThisWeekFestivals({ festivals }: ThisWeekFestivalsProps) {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const { genres: globalGenres } = useGlobalGenreFilter();

  const filteredFestivals = useMemo(() => {
    if (globalGenres.length === 0) return festivals;
    return festivals.filter((f) =>
      f.genres.some((g) => globalGenres.includes(g))
    );
  }, [festivals, globalGenres]);

  if (filteredFestivals.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredFestivals.slice(0, 4).map((festival, index) => (
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
