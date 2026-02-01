import { motion } from "framer-motion";
import { MapPin, Calendar, Ticket } from "lucide-react";
import { GenreBadge } from "./GenreBadge";
import { formatDateRange, getCountryFlag } from "@/lib/utils";
import type { Festival } from "@/types/festival";

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
        {festival.image ? (
          <img
            src={festival.image}
            alt={festival.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* View Details overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
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
      <div className="p-5">
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {festival.name}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              {getCountryFlag(festival.location.countryCode)} {festival.location.city}, {festival.location.country}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-secondary" />
            <span>{formatDateRange(festival.dates.start, festival.dates.end)}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Ticket className="w-4 h-4 text-accent" />
            <span>{festival.ticketInfo.priceRange}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
