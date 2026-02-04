"use client";

import { useState } from "react";
import { FestivalCard } from "./FestivalCard";
import { FestivalDetail } from "./FestivalDetail";
import type { Festival } from "@/types/festival";

interface FeaturedFestivalsProps {
  festivals: Festival[];
}

export function FeaturedFestivals({ festivals }: FeaturedFestivalsProps) {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {festivals.map((festival, index) => (
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
