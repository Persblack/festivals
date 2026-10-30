import { Badge } from "@/components/ui/badge";
import { getGenreColorHex } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GenreBadgeProps {
  genre: string;
  className?: string;
}

export function GenreBadge({ genre, className }: GenreBadgeProps) {
  return (
    <Badge
      className={cn("text-ink shadow-none", className)}
      style={{ backgroundColor: getGenreColorHex(genre) }}
    >
      {genre}
    </Badge>
  );
}
