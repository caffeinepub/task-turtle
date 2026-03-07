import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const starSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  const displayValue = hovered !== null ? hovered : value;

  return (
    <div
      className={cn("flex items-center", gap)}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            aria-pressed={star === value}
            disabled={readonly}
            tabIndex={readonly ? -1 : 0}
            onClick={() => {
              if (!readonly) onChange?.(star);
            }}
            onMouseEnter={() => {
              if (!readonly) setHovered(star);
            }}
            onMouseLeave={() => {
              if (!readonly) setHovered(null);
            }}
            onKeyDown={(e) => {
              if (!readonly && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onChange?.(star);
              }
            }}
            className={cn(
              "transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-sm",
              readonly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 active:scale-95",
            )}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors duration-100",
                filled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
