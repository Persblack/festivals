"use client";

import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface RandomFestivalButtonProps {
  /** Festival page paths. Paths, not festivals: the whole dataset as a prop was megabytes of HTML. */
  paths: string[];
}

export function RandomFestivalButton({ paths }: RandomFestivalButtonProps) {
  return (
    <Button
      onClick={() => window.location.assign(paths[Math.floor(Math.random() * paths.length)])}
      size="lg"
      variant="outline"
      className="h-auto rounded-xl px-7 py-4 text-base font-bold tracking-wider"
    >
      <Shuffle className="w-5 h-5 mr-2" />
      Surprise Me
    </Button>
  );
}
