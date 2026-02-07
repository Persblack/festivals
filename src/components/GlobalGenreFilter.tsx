"use client";

import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import { GenreBadge } from "./GenreBadge";
import { X } from "lucide-react";
import type { Genre } from "@/types/festival";

const GENRES: Genre[] = ["EDM", "Techno", "Rock", "Metal", "Else"];

export function GlobalGenreFilter() {
  const { genres, toggleGenre, clearGenres, hasActiveFilter } = useGlobalGenreFilter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => toggleGenre(genre)}
          className={`transition-all duration-200 ${
            genres.includes(genre)
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
              : hasActiveFilter
                ? "opacity-40 hover:opacity-70"
                : "opacity-70 hover:opacity-100"
          }`}
        >
          <GenreBadge genre={genre} />
        </button>
      ))}
      {hasActiveFilter && (
        <button
          onClick={clearGenres}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Clear genre filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
