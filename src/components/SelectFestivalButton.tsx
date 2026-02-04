"use client";

import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSelectedFestivals } from "@/hooks/useSelectedFestivals";
import { cn } from "@/lib/utils";

interface SelectFestivalButtonProps {
  festivalId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function SelectFestivalButton({
  festivalId,
  variant = "icon",
  className,
}: SelectFestivalButtonProps) {
  const { isSelected, toggleSelection } = useSelectedFestivals();
  const selected = isSelected(festivalId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking button
    toggleSelection(festivalId);
  };

  if (variant === "icon") {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm",
          className
        )}
        title={selected ? "Remove from planner" : "Add to planner"}
      >
        {selected ? (
          <Check className="w-5 h-5" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  return (
    <Button
      variant={selected ? "default" : "outline"}
      onClick={handleClick}
      className={cn(className)}
    >
      {selected ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Added to Planner
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Add to Planner
        </>
      )}
    </Button>
  );
}
