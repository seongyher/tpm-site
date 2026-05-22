import {
  type ArticleImageHeightPolicy,
  articleImageRolePolicy,
} from "../media/media-policy";

export type { ArticleImageHeightPolicy } from "../media/media-policy";

/** Stable presentation data consumed by components and the rehype plugin. */
interface ArticleImagePresentation {
  captionClass: string;
  figureClass: string;
  frameClass: string;
  imageClass: string;
  inspectionClass: string;
  isInspectable: boolean;
  policy: "bounded" | "natural";
  previewSizes: string;
}

const baseFigureClass =
  "not-prose mx-auto my-8 grid max-w-full gap-2 text-center first:mt-0";
const boundedFrameClass =
  "group/article-image relative mx-auto inline-flex w-fit max-w-full justify-self-center cursor-zoom-in items-center justify-center overflow-hidden rounded-sm border-0 bg-transparent p-0 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const naturalFrameClass =
  "mx-auto block w-fit max-w-full justify-self-center overflow-hidden rounded-sm text-center";
const boundedImageClass = [
  "mx-auto",
  "block",
  "h-auto",
  articleImageRolePolicy().maxHeightClass,
  "w-auto",
  "max-w-full",
  "rounded-sm",
  "object-contain",
].join(" ");
const naturalImageClass =
  "mx-auto block h-auto max-h-none max-w-full rounded-sm object-contain";
const captionClass = "text-muted-foreground text-center text-sm";
const inspectionClass = [
  "pointer-events-none",
  "absolute",
  "right-2",
  "top-2",
  "inline-flex",
  "size-8",
  "items-center",
  "justify-center",
  "rounded-full",
  "border",
  "border-border",
  "bg-background/90",
  "text-foreground",
  "opacity-0",
  "shadow-sm",
  "transition-opacity",
  "group-hover/article-image:opacity-100",
  "group-focus-visible/article-image:opacity-100",
  "pointer-coarse:opacity-100",
].join(" ");

/** Cache key passed to Astro so article image policy changes invalidate rendered content. */
export const articleImagePolicyCacheKey = JSON.stringify({
  baseFigureClass,
  boundedFrameClass,
  boundedImageClass,
  captionClass,
  inspectionClass,
  naturalFrameClass,
  naturalImageClass,
  previewSizes: articleImageRolePolicy().previewSizes,
  squareHeightCeilingClass: articleImageRolePolicy().maxHeightClass,
});

/**
 * Returns editorial presentation classes for a Markdown or component article image.
 *
 * The default policy is intentionally simple: every standalone unlinked article
 * image renders as a bounded optimized preview that can open a full-screen
 * inspector. The natural policy is an explicit escape hatch for intentional
 * component-authored images that should keep their intrinsic height.
 *
 * @param heightPolicy Explicit author/developer override for height handling.
 * @returns Stable class, inspectability, and responsive image sizing data.
 */
export function articleImagePresentation(
  heightPolicy: ArticleImageHeightPolicy = "auto",
): ArticleImagePresentation {
  const rolePolicy = articleImageRolePolicy(heightPolicy);

  if (heightPolicy === "natural") {
    return {
      captionClass,
      figureClass: baseFigureClass,
      frameClass: naturalFrameClass,
      imageClass: naturalImageClass,
      inspectionClass,
      isInspectable: rolePolicy.isInspectable,
      policy: rolePolicy.policy,
      previewSizes: rolePolicy.previewSizes,
    };
  }

  return {
    captionClass,
    figureClass: baseFigureClass,
    frameClass: boundedFrameClass,
    imageClass: boundedImageClass,
    inspectionClass,
    isInspectable: rolePolicy.isInspectable,
    policy: rolePolicy.policy,
    previewSizes: rolePolicy.previewSizes,
  };
}
