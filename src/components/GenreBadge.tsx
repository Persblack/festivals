import { Badge } from "@/components/ui/badge";
import type { Genre } from "@/types/festival";

interface GenreBadgeProps {
  genre: Genre;
  className?: string;
}

export function GenreBadge({ genre, className }: GenreBadgeProps) {
  const variant = genre.toLowerCase() as 'edm' | 'techno' | 'rock' | 'metal' | 'else';

  return (
    <Badge variant={variant} className={className}>
      {genre}
    </Badge>
  );
}
