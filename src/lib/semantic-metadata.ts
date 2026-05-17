import { z } from "astro/zod";

import { type JsonLdNode, routeEntityId } from "./metadata";
import { formatDate } from "./routes";

const semanticItemTypeSchema = z.enum([
  "article",
  "audio",
  "book",
  "creative-work",
  "dataset",
  "event",
  "software",
  "video",
]);

const nonEmptyString = z.string().trim().min(1);
const optionalUrl = z.string().url().optional();
const optionalDate = z.coerce.date().optional();
const peopleSchema = z.union([nonEmptyString, z.array(nonEmptyString).min(1)]);

const semanticItemSchema = z
  .object({
    author: peopleSchema.optional(),
    datePublished: optionalDate,
    description: nonEmptyString.optional(),
    name: nonEmptyString,
    type: semanticItemTypeSchema,
    url: optionalUrl,
  })
  .strict();

const ratingSchema = z
  .object({
    best: z.number().positive().optional(),
    value: z.number(),
    worst: z.number().optional(),
  })
  .strict()
  .superRefine((rating, context) => {
    if (
      rating.best !== undefined &&
      rating.worst !== undefined &&
      rating.best <= rating.worst
    ) {
      context.addIssue({
        code: "custom",
        message: "rating.best must be greater than rating.worst.",
        path: ["best"],
      });
    }
  });

const reviewSchema = z
  .object({
    item: semanticItemSchema,
    kind: z.literal("review"),
    rating: ratingSchema.optional(),
    summary: nonEmptyString.optional(),
  })
  .strict();

const eventLocationSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("online"),
      url: z.string().url(),
    })
    .strict(),
  z
    .object({
      address: nonEmptyString.optional(),
      name: nonEmptyString,
      type: z.literal("place"),
      url: optionalUrl,
    })
    .strict(),
]);

const eventSchema = z
  .object({
    attendance: z.enum(["mixed", "offline", "online"]).optional(),
    description: nonEmptyString.optional(),
    endDate: optionalDate,
    kind: z.literal("event"),
    location: eventLocationSchema.optional(),
    name: nonEmptyString,
    startDate: z.coerce.date(),
    status: z
      .enum([
        "cancelled",
        "moved-online",
        "postponed",
        "rescheduled",
        "scheduled",
      ])
      .default("scheduled"),
    url: optionalUrl,
  })
  .strict()
  .superRefine((event, context) => {
    if (event.endDate !== undefined && event.endDate < event.startDate) {
      context.addIssue({
        code: "custom",
        message: "event.endDate must be after event.startDate.",
        path: ["endDate"],
      });
    }
  });

const mediaSchema = z
  .object({
    description: nonEmptyString.optional(),
    duration: nonEmptyString.optional(),
    embedUrl: optionalUrl,
    kind: z.enum(["audio", "video"]),
    name: nonEmptyString,
    thumbnailUrl: optionalUrl,
    uploadDate: optionalDate,
    url: optionalUrl,
  })
  .strict();

const bookSchema = z
  .object({
    author: peopleSchema.optional(),
    datePublished: optionalDate,
    description: nonEmptyString.optional(),
    isbn: nonEmptyString.optional(),
    kind: z.literal("book"),
    name: nonEmptyString,
    publisher: nonEmptyString.optional(),
    url: optionalUrl,
  })
  .strict();

const distributionSchema = z
  .object({
    encodingFormat: nonEmptyString.optional(),
    url: z.string().url(),
  })
  .strict();

const datasetSchema = z
  .object({
    creator: peopleSchema.optional(),
    description: nonEmptyString,
    distribution: z.array(distributionSchema).default([]),
    kind: z.literal("dataset"),
    license: optionalUrl,
    name: nonEmptyString,
    url: optionalUrl,
  })
  .strict();

const softwareSchema = z
  .object({
    applicationCategory: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
    kind: z.literal("software"),
    license: optionalUrl,
    name: nonEmptyString,
    operatingSystem: nonEmptyString.optional(),
    url: optionalUrl,
    version: nonEmptyString.optional(),
  })
  .strict();

const faqSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            answer: nonEmptyString,
            question: nonEmptyString,
          })
          .strict(),
      )
      .min(1),
    kind: z.literal("faq"),
  })
  .strict();

export const semanticMetadataSchema = z
  .discriminatedUnion("kind", [
    reviewSchema,
    eventSchema,
    mediaSchema,
    bookSchema,
    datasetSchema,
    softwareSchema,
    faqSchema,
  ])
  .optional();

/** Optional author-facing semantic profile parsed from article-like frontmatter. */
export type SemanticMetadata = z.infer<typeof semanticMetadataSchema>;

/** Present semantic profile after callers have handled the omitted case. */
type SemanticMetadataProfile = Exclude<SemanticMetadata, undefined>;

/** Visible semantic facts rendered on article-like pages. */
export interface SemanticDetailsViewModel {
  description?: string | undefined;
  heading: string;
  items: readonly SemanticDetailsItem[];
}

/** One visible semantic fact for a page profile. */
interface SemanticDetailsItem {
  href?: string | undefined;
  label: string;
  value: string;
}

/** Optional semantic JSON-LD nodes plus references from the base article node. */
export interface SemanticJsonLdResult {
  nodes: readonly JsonLdNode[];
  references: ReadonlyArray<Record<"@id", string>>;
}

interface SemanticJsonLdInput {
  authorName: string;
  canonicalPath: string;
  datePublished: Date;
  site: string | undefined | URL;
}

/**
 * Builds visible semantic detail facts from validated frontmatter.
 *
 * @param semantic Optional semantic profile from article-like frontmatter.
 * @returns Compact details view model, or undefined when no profile exists.
 */
export function semanticDetailsViewModel(
  semantic: SemanticMetadata,
): SemanticDetailsViewModel | undefined {
  if (semantic === undefined) {
    return undefined;
  }

  switch (semantic.kind) {
    case "audio":
      return mediaDetails("Audio details", semantic);
    case "book":
      return compactDetails("Book details", semantic.description, [
        fact("Title", semantic.name, semantic.url),
        peopleFact("Author", semantic.author),
        fact("Publisher", semantic.publisher),
        fact("Published", formatDate(semantic.datePublished)),
        fact("ISBN", semantic.isbn),
      ]);
    case "dataset":
      return compactDetails("Dataset details", semantic.description, [
        fact("Dataset", semantic.name, semantic.url),
        peopleFact("Creator", semantic.creator),
        fact("License", semantic.license, semantic.license),
        fact(
          "Downloads",
          semantic.distribution
            .map(
              (distribution) => distribution.encodingFormat ?? distribution.url,
            )
            .join(", "),
        ),
      ]);
    case "event":
      return compactDetails("Event details", semantic.description, [
        fact("Event", semantic.name, semantic.url),
        fact("Starts", formatDate(semantic.startDate)),
        fact("Ends", formatDate(semantic.endDate)),
        fact(
          "Location",
          eventLocationLabel(semantic.location),
          eventLocationUrl(semantic.location),
        ),
        fact("Attendance", semantic.attendance),
        fact("Status", semantic.status),
      ]);
    case "faq":
      return {
        heading: "FAQ",
        items: semantic.items.map((item) => ({
          label: item.question,
          value: item.answer,
        })),
      };
    case "review":
      return compactDetails("Review details", semantic.summary, [
        fact("Reviewed", semantic.item.name, semantic.item.url),
        fact("Type", itemTypeLabel(semantic.item.type)),
        peopleFact("Author", semantic.item.author),
        fact("Published", formatDate(semantic.item.datePublished)),
        fact("Rating", ratingLabel(semantic.rating)),
      ]);
    case "software":
      return compactDetails("Software details", semantic.description, [
        fact("Software", semantic.name, semantic.url),
        fact("Version", semantic.version),
        fact("Category", semantic.applicationCategory),
        fact("Operating system", semantic.operatingSystem),
        fact("License", semantic.license, semantic.license),
      ]);
    case "video":
      return mediaDetails("Video details", semantic);
  }
}

/**
 * Builds optional semantic JSON-LD nodes from validated article-like metadata.
 *
 * @param semantic Optional semantic profile from frontmatter.
 * @param input Route and article facts used for stable IDs and authorship.
 * @returns JSON-LD nodes plus `@id` references for the base article node.
 */
export function semanticMetadataJsonLd(
  semantic: SemanticMetadata,
  input: SemanticJsonLdInput,
): SemanticJsonLdResult {
  if (semantic === undefined) {
    return { nodes: [], references: [] };
  }

  const id = semanticEntityId(input.canonicalPath, semantic.kind, input.site);
  const node = semanticNodeJsonLd(id, semantic, input);

  return {
    nodes: [node],
    references: [{ "@id": id }],
  };
}

function semanticNodeJsonLd(
  id: string,
  semantic: SemanticMetadataProfile,
  input: SemanticJsonLdInput,
): JsonLdNode {
  switch (semantic.kind) {
    case "audio":
      return mediaJsonLd(id, "AudioObject", semantic);
    case "book":
      return compactJsonLdNode({
        "@id": id,
        "@type": "Book",
        author: peopleJsonLd(semantic.author),
        datePublished: semantic.datePublished?.toISOString(),
        description: semantic.description,
        isbn: semantic.isbn,
        name: semantic.name,
        publisher: semantic.publisher,
        url: semantic.url,
      });
    case "dataset":
      return compactJsonLdNode({
        "@id": id,
        "@type": "Dataset",
        creator: peopleJsonLd(semantic.creator),
        description: semantic.description,
        distribution:
          semantic.distribution.length === 0
            ? undefined
            : semantic.distribution.map((distribution) =>
                compactJsonLdNode({
                  "@type": "DataDownload",
                  contentUrl: distribution.url,
                  encodingFormat: distribution.encodingFormat,
                }),
              ),
        license: semantic.license,
        name: semantic.name,
        url: semantic.url,
      });
    case "event":
      return compactJsonLdNode({
        "@id": id,
        "@type": "Event",
        attendanceMode: attendanceModeJsonLd(semantic.attendance),
        description: semantic.description,
        endDate: semantic.endDate?.toISOString(),
        eventStatus: eventStatusJsonLd(semantic.status),
        location: eventLocationJsonLd(semantic.location),
        name: semantic.name,
        startDate: semantic.startDate.toISOString(),
        url: semantic.url,
      });
    case "faq":
      return {
        "@id": id,
        "@type": "FAQPage",
        mainEntity: semantic.items.map((item) => ({
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
          name: item.question,
        })),
      };
    case "review":
      return compactJsonLdNode({
        "@id": id,
        "@type": "Review",
        author: {
          "@type": "Person",
          name: input.authorName,
        },
        datePublished: input.datePublished.toISOString(),
        itemReviewed: semanticItemJsonLd(semantic.item),
        reviewBody: semantic.summary,
        reviewRating: ratingJsonLd(semantic.rating),
      });
    case "software":
      return compactJsonLdNode({
        "@id": id,
        "@type": "SoftwareApplication",
        applicationCategory: semantic.applicationCategory,
        description: semantic.description,
        license: semantic.license,
        name: semantic.name,
        operatingSystem: semantic.operatingSystem,
        softwareVersion: semantic.version,
        url: semantic.url,
      });
    case "video":
      return mediaJsonLd(id, "VideoObject", semantic);
  }
}

function mediaDetails(
  heading: string,
  semantic: Extract<SemanticMetadataProfile, { kind: "audio" | "video" }>,
): SemanticDetailsViewModel {
  return compactDetails(heading, semantic.description, [
    fact("Title", semantic.name, semantic.url),
    fact("Published", formatDate(semantic.uploadDate)),
    fact("Duration", semantic.duration),
    fact("Embed", semantic.embedUrl, semantic.embedUrl),
  ]);
}

function mediaJsonLd(
  id: string,
  type: "AudioObject" | "VideoObject",
  semantic: Extract<SemanticMetadataProfile, { kind: "audio" | "video" }>,
): JsonLdNode {
  return compactJsonLdNode({
    "@id": id,
    "@type": type,
    description: semantic.description,
    duration: semantic.duration,
    embedUrl: semantic.embedUrl,
    name: semantic.name,
    thumbnailUrl: semantic.thumbnailUrl,
    uploadDate: semantic.uploadDate?.toISOString(),
    url: semantic.url,
  });
}

function semanticItemJsonLd(
  item: z.infer<typeof semanticItemSchema>,
): JsonLdNode {
  return compactJsonLdNode({
    "@type": schemaTypeForItem(item.type),
    author: peopleJsonLd(item.author),
    datePublished: item.datePublished?.toISOString(),
    description: item.description,
    name: item.name,
    url: item.url,
  });
}

function ratingJsonLd(
  rating: undefined | z.infer<typeof ratingSchema>,
): JsonLdNode | undefined {
  return rating === undefined
    ? undefined
    : compactJsonLdNode({
        "@type": "Rating",
        bestRating: rating.best,
        ratingValue: rating.value,
        worstRating: rating.worst,
      });
}

function peopleJsonLd(
  people: undefined | z.infer<typeof peopleSchema>,
): JsonLdNode | readonly JsonLdNode[] | undefined {
  if (people === undefined) {
    return undefined;
  }

  const names = Array.isArray(people) ? people : [people];
  const peopleNodes = names.map((name) => ({
    "@type": "Person",
    name,
  }));

  return peopleNodes.length === 1 ? peopleNodes[0] : peopleNodes;
}

function compactDetails(
  heading: string,
  description: string | undefined,
  items: ReadonlyArray<SemanticDetailsItem | undefined>,
): SemanticDetailsViewModel {
  return {
    description,
    heading,
    items: items.filter(
      (item): item is SemanticDetailsItem => item !== undefined,
    ),
  };
}

function fact(
  label: string,
  value: string | undefined,
  href?: string,
): SemanticDetailsItem | undefined {
  return value === undefined || value.length === 0
    ? undefined
    : { href, label, value };
}

function peopleFact(
  label: string,
  people: undefined | z.infer<typeof peopleSchema>,
): SemanticDetailsItem | undefined {
  if (people === undefined) {
    return undefined;
  }

  return fact(label, Array.isArray(people) ? people.join(", ") : people);
}

function ratingLabel(
  rating: undefined | z.infer<typeof ratingSchema>,
): string | undefined {
  if (rating === undefined) {
    return undefined;
  }

  return rating.best === undefined
    ? rating.value.toString()
    : `${rating.value}/${rating.best}`;
}

function semanticEntityId(
  canonicalPath: string,
  kind: SemanticMetadataProfile["kind"],
  site: string | undefined | URL,
): string {
  return routeEntityId(canonicalPath, `semantic-${kind}`, site);
}

function eventLocationLabel(
  location: undefined | z.infer<typeof eventLocationSchema>,
): string | undefined {
  if (location === undefined) {
    return undefined;
  }

  return location.type === "online" ? "Online" : location.name;
}

function eventLocationUrl(
  location: undefined | z.infer<typeof eventLocationSchema>,
): string | undefined {
  if (location === undefined) {
    return undefined;
  }

  return location.url;
}

function eventLocationJsonLd(
  location: undefined | z.infer<typeof eventLocationSchema>,
): JsonLdNode | undefined {
  if (location === undefined) {
    return undefined;
  }

  return location.type === "online"
    ? {
        "@type": "VirtualLocation",
        url: location.url,
      }
    : compactJsonLdNode({
        "@type": "Place",
        address: location.address,
        name: location.name,
        url: location.url,
      });
}

function attendanceModeJsonLd(
  attendance: z.infer<typeof eventSchema>["attendance"],
): string | undefined {
  switch (attendance) {
    case "mixed":
      return "https://schema.org/MixedEventAttendanceMode";
    case "offline":
      return "https://schema.org/OfflineEventAttendanceMode";
    case "online":
      return "https://schema.org/OnlineEventAttendanceMode";
    case undefined:
      return undefined;
  }
}

function eventStatusJsonLd(
  status: z.infer<typeof eventSchema>["status"],
): string {
  switch (status) {
    case "cancelled":
      return "https://schema.org/EventCancelled";
    case "moved-online":
      return "https://schema.org/EventMovedOnline";
    case "postponed":
      return "https://schema.org/EventPostponed";
    case "rescheduled":
      return "https://schema.org/EventRescheduled";
    case "scheduled":
      return "https://schema.org/EventScheduled";
  }
}

function itemTypeLabel(type: z.infer<typeof semanticItemTypeSchema>): string {
  switch (type) {
    case "article":
      return "Article";
    case "audio":
      return "Audio";
    case "book":
      return "Book";
    case "creative-work":
      return "Creative work";
    case "dataset":
      return "Dataset";
    case "event":
      return "Event";
    case "software":
      return "Software";
    case "video":
      return "Video";
  }
}

function schemaTypeForItem(
  type: z.infer<typeof semanticItemTypeSchema>,
): string {
  switch (type) {
    case "article":
      return "Article";
    case "audio":
      return "AudioObject";
    case "book":
      return "Book";
    case "creative-work":
      return "CreativeWork";
    case "dataset":
      return "Dataset";
    case "event":
      return "Event";
    case "software":
      return "SoftwareApplication";
    case "video":
      return "VideoObject";
  }
}

function compactJsonLdNode(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  );
}
