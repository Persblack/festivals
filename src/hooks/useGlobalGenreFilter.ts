"use client";

import { useState, useEffect, useCallback } from "react";
import type { Genre } from "@/types/festival";

const STORAGE_KEY = "festival-atlas-global-genres";
const EVENT_NAME = "global-genre-filter-change";

function readStorage(): Genre[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useGlobalGenreFilter() {
  const [genres, setGenres] = useState<Genre[]>(() => {
    if (typeof window === "undefined") return [];
    return readStorage();
  });

  // Sync from sessionStorage on mount (handles SSR hydration)
  useEffect(() => {
    setGenres(readStorage());
  }, []);

  // Listen for changes from other React islands on same page
  useEffect(() => {
    const handleChange = () => {
      setGenres(readStorage());
    };
    window.addEventListener(EVENT_NAME, handleChange);
    return () => window.removeEventListener(EVENT_NAME, handleChange);
  }, []);

  const updateStorage = useCallback((newGenres: Genre[]) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newGenres));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }, []);

  const toggleGenre = useCallback(
    (genre: Genre) => {
      const newGenres = genres.includes(genre)
        ? genres.filter((g) => g !== genre)
        : [...genres, genre];
      setGenres(newGenres);
      updateStorage(newGenres);
    },
    [genres, updateStorage]
  );

  const clearGenres = useCallback(() => {
    setGenres([]);
    updateStorage([]);
  }, [updateStorage]);

  return {
    genres,
    toggleGenre,
    clearGenres,
    hasActiveFilter: genres.length > 0,
  };
}
