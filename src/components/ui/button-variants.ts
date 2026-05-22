/** Shared size options for button-shaped controls. */
export type ButtonSize = "lg" | "md" | "sm";

/** Shared semantic tones for button-shaped controls. */
export type ButtonTone = "danger" | "neutral" | "primary";

/** Shared visual variants for button-shaped controls. */
export type ButtonVariant = "ghost" | "outline" | "solid";

/** Astro prefetch values supported by internal link-style buttons. */
export type PrefetchValue = "hover" | "load" | "tap" | "viewport" | boolean;

export const buttonControlBaseClasses =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-2 break-words rounded-sm border text-center font-semibold tracking-normal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60";

export const buttonLinkBaseClasses =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-2 break-words rounded-sm border text-center font-semibold tracking-normal no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:pointer-events-none aria-disabled:opacity-60";

export const buttonSizeClasses = {
  lg: "min-h-12 px-5 py-3 text-base",
  md: "min-h-10 px-4 py-2 text-sm",
  sm: "min-h-8 px-3 py-1.5 text-sm",
} as const satisfies Record<ButtonSize, string>;

export const buttonVariantClasses = {
  danger: {
    ghost:
      "border-transparent bg-transparent text-destructive hover:bg-destructive/10",
    outline:
      "border-destructive bg-transparent text-destructive hover:bg-destructive/10",
    solid:
      "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  neutral: {
    ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
    outline: "border-border bg-transparent text-foreground hover:bg-muted",
    solid:
      "border-transparent bg-foreground text-background hover:bg-foreground/90",
  },
  primary: {
    ghost: "border-transparent bg-transparent text-primary hover:bg-primary/10",
    outline: "border-primary bg-transparent text-primary hover:bg-primary/10",
    solid:
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  },
} as const satisfies Record<ButtonTone, Record<ButtonVariant, string>>;

/**
 * Converts Astro's prefetch prop shape into the attribute value Astro expects.
 *
 * @param prefetch Prefetch prop value provided to a link-style button.
 * @returns The serialized prefetch attribute value, or undefined when omitted.
 */
export function prefetchAttributeValue(
  prefetch: PrefetchValue | undefined,
): string | undefined {
  if (prefetch === undefined) {
    return undefined;
  }

  if (prefetch === false) {
    return "false";
  }

  if (prefetch === true) {
    return "hover";
  }

  return prefetch;
}
