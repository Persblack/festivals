"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Plus, Check, X, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { GenreBadge } from "./GenreBadge";
import { useSelectedFestivals } from "@/hooks/useSelectedFestivals";
import { formatDateRange, getCountryFlag } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Festival } from "@/types/festival";

interface FestivalSearchProps {
  festivals: Festival[];
  className?: string;
}

export function FestivalSearch({ festivals, className }: FestivalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { isSelected, toggleSelection } = useSelectedFestivals();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter festivals based on search query
  const filteredFestivals = useMemo(() => {
    if (!query.trim()) return [];
    const searchTerm = query.toLowerCase();
    return festivals.filter((f) =>
      f.name.toLowerCase().includes(searchTerm) ||
      f.city.toLowerCase().includes(searchTerm) ||
      f.country_name.toLowerCase().includes(searchTerm) ||
      f.genres.some((g) => g.toLowerCase().includes(searchTerm))
    );
  }, [query, festivals]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (festival: Festival) => {
    toggleSelection(festival.id);
    // Keep dropdown open for multiple selections
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search festivals to add..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50"
          >
            {filteredFestivals.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No festivals found for "{query}"
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {filteredFestivals.slice(0, 10).map((festival) => {
                  const selected = isSelected(festival.id);
                  return (
                    <button
                      key={festival.id}
                      onClick={() => handleSelect(festival)}
                      className={cn(
                        "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                        selected && "bg-primary/10"
                      )}
                    >
                      {/* Selection indicator */}
                      <div
                        className={cn(
                          "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {selected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>

                      {/* Festival info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {festival.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getCountryFlag(festival.country_code)} {festival.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateRange(festival.start_date, festival.end_date)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {festival.genres.slice(0, 3).map((genre) => (
                            <GenreBadge key={genre} genre={genre} className="text-[10px] px-2 py-0" />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredFestivals.length > 10 && (
                  <div className="p-2 text-center text-xs text-muted-foreground border-t border-border">
                    {filteredFestivals.length - 10} more results...
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
