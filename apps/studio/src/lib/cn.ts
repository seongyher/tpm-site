import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional Studio class names while preserving Tailwind conflict
 * resolution.
 *
 * @param values Conditional class names to merge.
 * @returns A Tailwind-conflict-aware class string.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
