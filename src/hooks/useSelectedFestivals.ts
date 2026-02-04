"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "festival-planner-selection";
const EVENT_NAME = "festival-selection-change";

export function useSelectedFestivals() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSelectedIds(JSON.parse(stored));
      } catch {
        setSelectedIds([]);
      }
    }
  }, []);

  // Listen for changes from other components
  useEffect(() => {
    const handleChange = () => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSelectedIds(JSON.parse(stored));
        } catch {
          setSelectedIds([]);
        }
      } else {
        setSelectedIds([]);
      }
    };

    window.addEventListener(EVENT_NAME, handleChange);
    return () => window.removeEventListener(EVENT_NAME, handleChange);
  }, []);

  const updateStorage = useCallback((ids: string[]) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id];
      setSelectedIds(newIds);
      updateStorage(newIds);
    },
    [selectedIds, updateStorage]
  );

  const clearAll = useCallback(() => {
    setSelectedIds([]);
    updateStorage([]);
  }, [updateStorage]);

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    clearAll,
    count: selectedIds.length,
  };
}
