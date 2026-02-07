"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Ticket, Clock } from "lucide-react";
import { GenreBadge } from "./GenreBadge";
import { SelectFestivalButton } from "./SelectFestivalButton";
import { formatDateRange, getCountryFlag, formatPriceRange, getGenreCoverImage } from "@/lib/utils";
import type { Festival } from "@/types/festival";

function getCountdown(startDate: string, endDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (now > end) {
    return { label: "Already over", color: "text-muted-foreground" };
  }
  if (now >= start) {
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      label: daysLeft === 0 ? "Ends today" : `Ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      color: "text-green-400",
    };
  }
  const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    label: daysUntil === 1 ? "Starts tomorrow" : `In ${daysUntil} days`,
    color: daysUntil <= 7 ? "text-yellow-400" : "text-muted-foreground",
  };
}

interface FestivalCardProps {
  festival: Festival;
  onClick: () => void;
  index?: number;
}

export function FestivalCard({ festival, onClick, index = 0 }: FestivalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl bg-card overflow-hidden shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border border-border/50"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        {/* Blurred genre cover image */}
        <img
          src={getGenreCoverImage(festival.genres)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Selection button */}
        <div className="absolute top-3 right-3 z-10">
          <SelectFestivalButton festivalId={festival.id} variant="icon" />
        </div>

        {/* Centered festival name */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <h3 className="text-xl font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {festival.name}
          </h3>
        </div>

        {/* View Details overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
          <span className="px-4 py-2 rounded-full bg-primary text-white font-medium text-sm">
            View Details
          </span>
        </div>

        {/* Genre badges positioned on image */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {festival.genres.map((genre) => (
            <GenreBadge key={genre} genre={genre} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              {getCountryFlag(festival.country_code)} {festival.city}, {festival.country_name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-secondary" />
            <span>{formatDateRange(festival.start_date, festival.end_date)}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Ticket className="w-4 h-4 text-accent" />
            <span>{formatPriceRange(festival.ticket_price_min, festival.ticket_price_max, festival.currency)}</span>
          </div>

          {(() => {
            const countdown = getCountdown(festival.start_date, festival.end_date);
            return (
              <div className={`flex items-center gap-2 ${countdown.color}`}>
                <Clock className="w-4 h-4" />
                <span>{countdown.label}</span>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}
