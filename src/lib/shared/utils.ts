import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Composes conditional class values and resolves Tailwind utility conflicts.
 *
 * @param inputs Class values accepted by clsx.
 * @returns Merged class string suitable for React components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
