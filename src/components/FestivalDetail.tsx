import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "./GenreBadge";
import { SelectFestivalButton } from "./SelectFestivalButton";
import { formatDateRange, getCountryFlag, getSizeLabel, formatPriceRange, getGenreCoverImage } from "@/lib/utils";
import type { Festival } from "@/types/festival";
import {
  MapPin,
  Calendar,
  Ticket,
  Globe,
  Instagram,
  Users,
  Music,
  Navigation,
  Share2,
  Clock,
} from "lucide-react";

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

interface FestivalDetailProps {
  festival: Festival | null;
  open: boolean;
  onClose: () => void;
}

export function FestivalDetail({ festival, open, onClose }: FestivalDetailProps) {
  if (!festival) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Hero Image */}
        <div className="relative -mx-6 -mt-6 h-64 overflow-hidden rounded-t-2xl">
          {/* Blurred genre cover image */}
          <img
            src={getGenreCoverImage(festival.genres)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-[3px] scale-105"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Centered festival name */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <DialogHeader className="text-center">
              <DialogTitle className="text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {festival.name}
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-2 flex items-center justify-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <MapPin className="w-4 h-4" />
                {getCountryFlag(festival.country_code)} {festival.city},{" "}
                {festival.country_name}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          {/* Quick Info Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            {festival.genres.map((genre) => (
              <GenreBadge key={genre} genre={genre} />
            ))}
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDateRange(festival.start_date, festival.end_date)}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              {getSizeLabel(festival.size)}
            </span>
            <span className="text-muted-foreground">•</span>
            {(() => {
              const countdown = getCountdown(festival.start_date, festival.end_date);
              return (
                <span className={`text-sm flex items-center gap-1 ${countdown.color}`}>
                  <Clock className="w-4 h-4" />
                  {countdown.label}
                </span>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {festival.ticket_link && (
              <Button asChild>
                <a href={festival.ticket_link} target="_blank" rel="noopener noreferrer">
                  <Ticket className="w-4 h-4 mr-2" />
                  Buy Tickets · {formatPriceRange(festival.ticket_price_min, festival.ticket_price_max, festival.currency)}
                </a>
              </Button>
            )}
            {!festival.ticket_link && (
              <Button disabled>
                <Ticket className="w-4 h-4 mr-2" />
                {formatPriceRange(festival.ticket_price_min, festival.ticket_price_max, festival.currency)}
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={festival.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
            {festival.instagram && (
              <Button variant="outline" asChild>
                <a href={festival.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${festival.latitude},${festival.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Google Maps
              </a>
            </Button>
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: festival.name,
                    text: `${festival.name} — ${formatDateRange(festival.start_date, festival.end_date)} in ${festival.city}, ${festival.country_name}`,
                    url: festival.website,
                  });
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <SelectFestivalButton festivalId={festival.id} variant="full" />
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <h4 className="text-lg font-semibold text-foreground">About</h4>
            {festival.description ? (
              <p className="text-muted-foreground leading-relaxed">{festival.description}</p>
            ) : (
              <p className="text-muted-foreground leading-relaxed italic">No description available.</p>
            )}
            <p className="text-sm text-muted-foreground">
              <strong>Venue:</strong> {festival.venue}
            </p>
          </motion.div>

          {/* Lineup */}
          {festival.lineup && festival.lineup.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Lineup
              </h4>
              <div className="flex flex-wrap gap-2">
                {festival.lineup.map((artist) => (
                  <span
                    key={artist}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground transition-colors hover:bg-primary/20"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
