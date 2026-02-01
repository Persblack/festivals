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
import { AttendanceChart } from "./AttendanceChart";
import { formatDateRange, getCountryFlag, getSizeLabel } from "@/lib/utils";
import type { Festival } from "@/types/festival";
import {
  MapPin,
  Calendar,
  Ticket,
  Globe,
  Instagram,
  Users,
  Music,
  ExternalLink,
  Quote,
} from "lucide-react";

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
          {festival.image ? (
            <img
              src={festival.image}
              alt={festival.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-white drop-shadow-lg">
                {festival.name}
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {getCountryFlag(festival.location.countryCode)} {festival.location.city},{" "}
                {festival.location.country}
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
              {formatDateRange(festival.dates.start, festival.dates.end)}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              {getSizeLabel(festival.size)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={festival.ticketInfo.ticketLink} target="_blank" rel="noopener noreferrer">
                <Ticket className="w-4 h-4 mr-2" />
                Buy Tickets · {festival.ticketInfo.priceRange}
              </a>
            </Button>
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
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <h4 className="text-lg font-semibold text-foreground">About</h4>
            <p className="text-muted-foreground leading-relaxed">{festival.description}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Venue:</strong> {festival.location.venue}
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

          {/* Review Summary */}
          {festival.reviewSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Quote className="w-5 h-5 text-secondary" />
                What People Say
              </h4>
              <blockquote className="border-l-4 border-secondary pl-4 py-2 bg-muted/50 rounded-r-lg italic text-muted-foreground">
                "{festival.reviewSummary}"
              </blockquote>
            </motion.div>
          )}

          {/* Historical Data Chart */}
          {festival.historicalData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h4 className="text-lg font-semibold text-foreground">Attendance History</h4>
              <AttendanceChart data={festival.historicalData.years} />
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
