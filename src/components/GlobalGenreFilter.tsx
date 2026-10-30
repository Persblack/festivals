"use client";

import { useGlobalGenreFilter } from "@/hooks/useGlobalGenreFilter";
import { GENRE_CATEGORIES, SINS } from "@/lib/genre-utils";
import { X } from "lucide-react";

export function GlobalGenreFilter() {
  const { genres, toggleGenre, clearGenres, hasActiveFilter } = useGlobalGenreFilter();

  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by sin">
      {GENRE_CATEGORIES.map((genre) => {
        const { sin, color } = SINS[genre];
        const on = genres.includes(genre);
        return (
          <button
            key={genre}
            type="button"
            aria-pressed={on}
            onClick={() => toggleGenre(genre)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              on ? "text-ink" : "border-input bg-field text-foreground hover:bg-muted"
            }`}
            style={on ? { backgroundColor: color, borderColor: color } : undefined}
          >
            {!on && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
            <span className="font-display text-base leading-none">{sin}</span>
            <span className={on ? "text-xs text-ink/80" : "text-xs text-muted-foreground"}>{genre}</span>
          </button>
        );
      })}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearGenres}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Clear sin filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
