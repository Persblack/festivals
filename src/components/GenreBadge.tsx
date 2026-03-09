import { Badge } from "@/components/ui/badge";
import { getGenreCategory } from "@/lib/genre-utils";

interface GenreBadgeProps {
  genre: string;
  className?: string;
}

export function GenreBadge({ genre, className }: GenreBadgeProps) {
  const category = getGenreCategory(genre);
  const variant = category.toLowerCase() as 'edm' | 'hip-hop' | 'rock' | 'metal' | 'else';

  return (
    <Badge variant={variant} className={className}>
      {genre}
    </Badge>
  );
}
