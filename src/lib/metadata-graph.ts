import {
  jsonLdGraph,
  type JsonLdNode,
  type RouteMetadata,
  siteIdentityJsonLd,
  webPageJsonLd,
} from "./metadata";
import { feedUrl } from "./routes";
import { absoluteUrl, safeJsonLd } from "./seo";
import { type SiteConfig, siteConfig } from "./site-config";
import type { SocialPreviewImage } from "./social-images";

/** Document-level Open Graph type supported by the platform head adapter. */
type MetadataDocumentType = "article" | "website";

/** Link tag emitted by document-level metadata. */
interface MetadataLinkTag {
  href: string;
  rel: string;
  title?: string | undefined;
  type?: string | undefined;
}

/** Social preview image facts normalized for HTML metadata adapters. */
interface MetadataSocialImage {
  alt?: string | undefined;
  height: number;
  type: string;
  url: string;
  width: number;
}

/** Open Graph facts normalized from route metadata and site config. */
interface OpenGraphMetadata {
  description: string;
  image?: MetadataSocialImage | undefined;
  locale: string;
  siteName: string;
  title: string;
  type: MetadataDocumentType;
  url: string;
}

/** Twitter card facts normalized from route metadata and site config. */
interface TwitterMetadata {
  card: "summary" | "summary_large_image";
  description: string;
  image?: string | undefined;
  imageAlt?: string | undefined;
  site?: string | undefined;
  title: string;
}

/** Normalized document metadata consumed by `<head>` adapters. */
export interface RouteMetadataGraphViewModel {
  applicationName: string;
  canonicalUrl: string;
  description: string;
  feedAlternate?: MetadataLinkTag | undefined;
  jsonLd?: string | undefined;
  openGraph: OpenGraphMetadata;
  robots: RouteMetadata["robots"];
  themeColor?: string | undefined;
  title: string;
  twitter: TwitterMetadata;
}

/** Inputs for route-level metadata graph normalization. */
interface RouteMetadataGraphInput {
  config?: SiteConfig | undefined;
  image?: SocialPreviewImage | undefined;
  metadata: RouteMetadata;
  site: string | undefined | URL;
  structuredData?: ReadonlyArray<JsonLdNode | undefined> | undefined;
  type?: MetadataDocumentType | undefined;
  webPageMainEntity?: JsonLdNode | undefined;
}

/**
 * Builds the normalized metadata graph view consumed by document head output.
 *
 * @param input Route metadata, site origin, optional image, and graph nodes.
 * @param input.config Site configuration override for tests or alternate
 *   site instances.
 * @param input.image Optional normalized social preview image facts.
 * @param input.metadata Normalized route metadata.
 * @param input.site Astro site origin when available.
 * @param input.structuredData Optional route-specific JSON-LD nodes.
 * @param input.type Document-level Open Graph type.
 * @param input.webPageMainEntity Optional route-specific WebPage main entity.
 * @returns Head metadata facts with canonical/social/JSON-LD output resolved.
 */
export function routeMetadataGraphViewModel({
  config = siteConfig,
  image,
  metadata,
  site,
  structuredData = [],
  type = "website",
  webPageMainEntity,
}: RouteMetadataGraphInput): RouteMetadataGraphViewModel {
  const canonicalUrl = absoluteUrl(metadata.canonicalPath, site);
  const socialImage =
    image === undefined
      ? undefined
      : {
          alt: image.alt,
          height: image.height,
          type: image.type,
          url: absoluteUrl(image.src, site),
          width: image.width,
        };
  const graph = jsonLdGraph([
    ...siteIdentityJsonLd(site, config),
    webPageJsonLd(metadata, site, config, { mainEntity: webPageMainEntity }),
    ...structuredData.filter((node): node is JsonLdNode => node !== undefined),
  ]);

  return {
    applicationName: config.identity.shortTitle ?? config.identity.title,
    canonicalUrl,
    description: metadata.description,
    feedAlternate: config.features.feed
      ? {
          href: feedUrl(),
          rel: "alternate",
          title: `${config.identity.title} RSS`,
          type: "application/rss+xml",
        }
      : undefined,
    jsonLd: graph === undefined ? undefined : safeJsonLd(graph),
    openGraph: {
      description: metadata.description,
      image: socialImage,
      locale: config.identity.locale,
      siteName: config.identity.title,
      title: metadata.title,
      type,
      url: canonicalUrl,
    },
    robots: metadata.robots,
    themeColor: config.identity.themeColor,
    title: metadata.title,
    twitter: {
      card: socialImage === undefined ? "summary" : "summary_large_image",
      description: metadata.description,
      image: socialImage?.url,
      imageAlt: socialImage?.alt,
      site: twitterHandle(config.share.xViaHandle),
      title: metadata.title,
    },
  };
}

function twitterHandle(handle: string | undefined): string | undefined {
  return handle === undefined ? undefined : `@${handle.replace(/^@/u, "")}`;
}
