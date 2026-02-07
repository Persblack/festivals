"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FestivalDetail } from "./FestivalDetail";
import { Shuffle } from "lucide-react";
import type { Festival } from "@/types/festival";

interface RandomFestivalButtonProps {
  festivals: Festival[];
}

export function RandomFestivalButton({ festivals }: RandomFestivalButtonProps) {
  const [selected, setSelected] = useState<Festival | null>(null);

  const pickRandom = () => {
    const random = festivals[Math.floor(Math.random() * festivals.length)];
    setSelected(random);
  };

  return (
    <>
      <Button
        onClick={pickRandom}
        size="lg"
        variant="outline"
        className="rounded-full px-8"
      >
        <Shuffle className="w-5 h-5 mr-2" />
        Surprise Me
      </Button>

      <FestivalDetail
        festival={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
