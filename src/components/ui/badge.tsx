import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all duration-200 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-primary/30",
        secondary: "bg-secondary text-secondary-foreground shadow-secondary/30",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border text-foreground bg-transparent",
        edm: "bg-genre-edm text-white shadow-genre-edm/30",
        techno: "bg-genre-techno text-white shadow-genre-techno/30",
        rock: "bg-genre-rock text-white shadow-genre-rock/30",
        metal: "bg-genre-metal text-white shadow-genre-metal/30",
        else: "bg-genre-else text-white shadow-genre-else/30",
        "hip-hop": "bg-orange-500 text-white shadow-orange-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
