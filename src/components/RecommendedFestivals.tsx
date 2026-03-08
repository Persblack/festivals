"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { FestivalCard } from "./FestivalCard";
import type { Festival } from "@/types/festival";

interface RecommendedFestivalsProps {
  festivals: Festival[];
  onFestivalClick: (festival: Festival) => void;
  title?: string;
}

export function RecommendedFestivals({
  festivals,
  onFestivalClick,
  title = "Similar Festivals",
}: RecommendedFestivalsProps) {
  if (festivals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {festivals.map((festival, index) => (
          <FestivalCard
            key={festival.id}
            festival={festival}
            onClick={() => onFestivalClick(festival)}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
