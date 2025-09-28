import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge conditional classNames with Tailwind merge
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
