"use client";

import { motion } from "framer-motion";
import { Music, ChevronDown } from "lucide-react";
import { GenreBadge } from "./GenreBadge";
import { getArtistCoverImage } from "@/lib/utils";

interface ArtistCardProps {
  name: string;
  festivalCount: number;
  genres: string[];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export function ArtistCard({
  name,
  festivalCount,
  genres,
  isExpanded,
  onToggle,
  index,
}: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onToggle}
      className="group relative cursor-pointer rounded-2xl bg-card overflow-hidden shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border border-border/50"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={getArtistCoverImage(genres)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Artist name centered */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <h3 className="text-lg font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {name}
          </h3>
        </div>

        {/* Expand indicator */}
        <div className="absolute bottom-2 right-2">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/70" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span>
            {festivalCount} festival{festivalCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {genres.map((genre) => (
            <GenreBadge key={genre} genre={genre} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
