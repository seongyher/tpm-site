import { describe, expect, test } from "bun:test";

import {
  semanticDetailsViewModel,
  type SemanticMetadata,
  semanticMetadataJsonLd,
  semanticMetadataSchema,
} from "../../../../src/lib/metadata/semantic-metadata";

describe("semantic metadata", () => {
  test("validates supported semantic profile kinds", () => {
    expect(
      semanticMetadataSchema.safeParse({
        item: {
          author: "Example Author",
          name: "Example Book",
          type: "book",
          url: "https://example.com/book",
        },
        kind: "review",
        rating: {
          best: 5,
          value: 4,
        },
        summary: "A visible review summary.",
      }).success,
    ).toBe(true);
    expect(
      semanticMetadataSchema.safeParse({
        kind: "faq",
        items: [
          {
            answer: "Because it is visible on the page.",
            question: "Why use FAQ metadata?",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      semanticMetadataSchema.safeParse({
        kind: "event",
        name: "Broken Event",
      }).success,
    ).toBe(false);
    expect(
      semanticMetadataSchema.safeParse({
        item: {
          name: "Example Book",
          type: "book",
        },
        kind: "review",
        rating: {
          best: 1,
          value: 4,
          worst: 5,
        },
      }).success,
    ).toBe(false);
    expect(
      semanticMetadataSchema.safeParse({
        endDate: "2026-05-01",
        kind: "event",
        name: "Impossible Event",
        startDate: "2026-06-01",
      }).success,
    ).toBe(false);
  });

  test("omits details and JSON-LD when no semantic profile is configured", () => {
    expect(semanticDetailsViewModel(undefined)).toBeUndefined();
    expect(semanticMetadataJsonLd(undefined, jsonLdInput())).toEqual({
      nodes: [],
      references: [],
    });
  });

  test("builds visible semantic details without empty facts", () => {
    const details = semanticDetailsViewModel({
      item: {
        author: ["Example Author", "Second Author"],
        name: "Example Book",
        type: "book",
      },
      kind: "review",
      rating: {
        best: 5,
        value: 4,
      },
      summary: "A visible review summary.",
    });

    expect(details).toMatchObject({
      description: "A visible review summary.",
      heading: "Review details",
      items: [
        { label: "Reviewed", value: "Example Book" },
        { label: "Type", value: "Book" },
        { label: "Author", value: "Example Author, Second Author" },
        { label: "Rating", value: "4/5" },
      ],
    });
  });

  test("builds visible details for platform-supported semantic profile kinds", () => {
    expect(
      semanticDetailsViewModel({
        description: "Audio context.",
        duration: "PT12M",
        embedUrl: "https://example.com/audio/embed",
        kind: "audio",
        name: "Audio Clip",
        uploadDate: new Date("2026-01-02T00:00:00.000Z"),
        url: "https://example.com/audio",
      }),
    ).toMatchObject({
      description: "Audio context.",
      heading: "Audio details",
      items: [
        {
          href: "https://example.com/audio",
          label: "Title",
          value: "Audio Clip",
        },
        { label: "Published", value: "January 2, 2026" },
        { label: "Duration", value: "PT12M" },
        {
          href: "https://example.com/audio/embed",
          label: "Embed",
          value: "https://example.com/audio/embed",
        },
      ],
    });

    expect(
      semanticDetailsViewModel({
        author: "Book Author",
        datePublished: new Date("2024-03-04T00:00:00.000Z"),
        description: "Book context.",
        isbn: "9780000000000",
        kind: "book",
        name: "A Book",
        publisher: "Publisher",
        url: "https://example.com/book",
      }),
    ).toMatchObject({
      description: "Book context.",
      heading: "Book details",
      items: [
        { href: "https://example.com/book", label: "Title", value: "A Book" },
        { label: "Author", value: "Book Author" },
        { label: "Publisher", value: "Publisher" },
        { label: "Published", value: "March 4, 2024" },
        { label: "ISBN", value: "9780000000000" },
      ],
    });

    expect(
      semanticDetailsViewModel({
        creator: ["Data Author", "Second Data Author"],
        description: "Dataset context.",
        distribution: [
          {
            encodingFormat: "text/csv",
            url: "https://example.com/data.csv",
          },
          {
            url: "https://example.com/data.json",
          },
        ],
        kind: "dataset",
        license: "https://example.com/license",
        name: "Dataset",
        url: "https://example.com/dataset",
      }),
    ).toMatchObject({
      description: "Dataset context.",
      heading: "Dataset details",
      items: [
        {
          href: "https://example.com/dataset",
          label: "Dataset",
          value: "Dataset",
        },
        { label: "Creator", value: "Data Author, Second Data Author" },
        {
          href: "https://example.com/license",
          label: "License",
          value: "https://example.com/license",
        },
        {
          label: "Downloads",
          value: "text/csv, https://example.com/data.json",
        },
      ],
    });

    expect(
      semanticDetailsViewModel({
        applicationCategory: "Reference",
        description: "Software context.",
        kind: "software",
        license: "https://example.com/software-license",
        name: "App",
        operatingSystem: "Web",
        url: "https://example.com/app",
        version: "1.2.3",
      }),
    ).toMatchObject({
      description: "Software context.",
      heading: "Software details",
      items: [
        { href: "https://example.com/app", label: "Software", value: "App" },
        { label: "Version", value: "1.2.3" },
        { label: "Category", value: "Reference" },
        { label: "Operating system", value: "Web" },
        {
          href: "https://example.com/software-license",
          label: "License",
          value: "https://example.com/software-license",
        },
      ],
    });

    expect(
      semanticDetailsViewModel({
        attendance: "online",
        description: "Event context.",
        endDate: new Date("2026-06-02T20:00:00.000Z"),
        kind: "event",
        location: {
          type: "online",
          url: "https://example.com/live",
        },
        name: "Launch Event",
        startDate: new Date("2026-06-01T19:00:00.000Z"),
        status: "scheduled",
        url: "https://example.com/event",
      }),
    ).toMatchObject({
      description: "Event context.",
      heading: "Event details",
      items: [
        {
          href: "https://example.com/event",
          label: "Event",
          value: "Launch Event",
        },
        { label: "Starts", value: "June 1, 2026" },
        { label: "Ends", value: "June 2, 2026" },
        {
          href: "https://example.com/live",
          label: "Location",
          value: "Online",
        },
        { label: "Attendance", value: "online" },
        { label: "Status", value: "scheduled" },
      ],
    });

    expect(
      semanticDetailsViewModel({
        description: "Video context.",
        duration: "PT5M",
        kind: "video",
        name: "Video Clip",
      }),
    ).toMatchObject({
      description: "Video context.",
      heading: "Video details",
      items: [
        { label: "Title", value: "Video Clip" },
        { label: "Duration", value: "PT5M" },
      ],
    });

    expect(
      semanticDetailsViewModel({
        kind: "faq",
        items: [
          {
            answer: "Use author-facing frontmatter.",
            question: "How are semantic details configured?",
          },
        ],
      }),
    ).toEqual({
      heading: "FAQ",
      items: [
        {
          label: "How are semantic details configured?",
          value: "Use author-facing frontmatter.",
        },
      ],
    });
  });

  test("builds semantic JSON-LD nodes and article references", () => {
    const result = semanticMetadataJsonLd(
      {
        description: "A release event.",
        kind: "event",
        location: {
          type: "online",
          url: "https://example.com/live",
        },
        name: "Launch Event",
        startDate: new Date("2026-06-01T19:00:00.000Z"),
        status: "scheduled",
      },
      jsonLdInput(),
    );

    expect(result.references).toEqual([
      {
        "@id": "https://example.com/articles/launch-event/#semantic-event",
      },
    ]);
    expect(result.nodes[0]).toMatchObject({
      "@id": "https://example.com/articles/launch-event/#semantic-event",
      "@type": "Event",
      description: "A release event.",
      location: {
        "@type": "VirtualLocation",
        url: "https://example.com/live",
      },
      name: "Launch Event",
      startDate: "2026-06-01T19:00:00.000Z",
    });
  });

  test("builds JSON-LD for each semantic entity family", () => {
    expect(
      semanticNode({
        description: "Audio context.",
        duration: "PT12M",
        kind: "audio",
        name: "Audio Clip",
        uploadDate: new Date("2026-01-02T00:00:00.000Z"),
        url: "https://example.com/audio",
      }),
    ).toMatchObject({
      "@id": "https://example.com/articles/launch-event/#semantic-audio",
      "@type": "AudioObject",
      duration: "PT12M",
      name: "Audio Clip",
      uploadDate: "2026-01-02T00:00:00.000Z",
    });

    expect(
      semanticNode({
        description: "Video context.",
        duration: "PT5M",
        embedUrl: "https://example.com/video/embed",
        kind: "video",
        name: "Video Clip",
        thumbnailUrl: "https://example.com/video.jpg",
        uploadDate: new Date("2025-08-09T00:00:00.000Z"),
        url: "https://example.com/video",
      }),
    ).toMatchObject({
      "@id": "https://example.com/articles/launch-event/#semantic-video",
      "@type": "VideoObject",
      embedUrl: "https://example.com/video/embed",
      name: "Video Clip",
      thumbnailUrl: "https://example.com/video.jpg",
      uploadDate: "2025-08-09T00:00:00.000Z",
    });

    expect(
      semanticNode({
        author: ["Book Author", "Second Book Author"],
        datePublished: new Date("2024-03-04T00:00:00.000Z"),
        description: "Book context.",
        isbn: "9780000000000",
        kind: "book",
        name: "A Book",
        publisher: "Publisher",
        url: "https://example.com/book",
      }),
    ).toMatchObject({
      "@type": "Book",
      author: [
        { "@type": "Person", name: "Book Author" },
        { "@type": "Person", name: "Second Book Author" },
      ],
      datePublished: "2024-03-04T00:00:00.000Z",
      isbn: "9780000000000",
      publisher: "Publisher",
    });

    expect(
      semanticNode({
        creator: "Data Author",
        description: "Dataset context.",
        distribution: [
          {
            encodingFormat: "application/json",
            url: "https://example.com/data.json",
          },
        ],
        kind: "dataset",
        license: "https://example.com/license",
        name: "Dataset",
      }),
    ).toMatchObject({
      "@type": "Dataset",
      creator: { "@type": "Person", name: "Data Author" },
      distribution: [
        {
          "@type": "DataDownload",
          contentUrl: "https://example.com/data.json",
          encodingFormat: "application/json",
        },
      ],
      license: "https://example.com/license",
    });

    expect(
      semanticNode({
        kind: "faq",
        items: [
          {
            answer: "Use author-facing frontmatter.",
            question: "How are semantic details configured?",
          },
        ],
      }),
    ).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use author-facing frontmatter.",
          },
          name: "How are semantic details configured?",
        },
      ],
    });

    expect(
      semanticNode({
        applicationCategory: "Reference",
        description: "Software context.",
        kind: "software",
        license: "https://example.com/software-license",
        name: "App",
        operatingSystem: "Web",
        url: "https://example.com/app",
        version: "1.2.3",
      }),
    ).toMatchObject({
      "@type": "SoftwareApplication",
      applicationCategory: "Reference",
      license: "https://example.com/software-license",
      operatingSystem: "Web",
      softwareVersion: "1.2.3",
    });

    expect(
      semanticNode({
        item: {
          author: "Reviewed Author",
          datePublished: new Date("2023-04-05T00:00:00.000Z"),
          name: "Reviewed Work",
          type: "creative-work",
        },
        kind: "review",
        rating: {
          value: 4,
        },
        summary: "Review summary.",
      }),
    ).toMatchObject({
      "@type": "Review",
      author: { "@type": "Person", name: "Author" },
      datePublished: "2026-05-01T00:00:00.000Z",
      itemReviewed: {
        "@type": "CreativeWork",
        author: { "@type": "Person", name: "Reviewed Author" },
        datePublished: "2023-04-05T00:00:00.000Z",
        name: "Reviewed Work",
      },
      reviewBody: "Review summary.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: 4,
      },
    });
  });

  test("maps semantic item kinds to visible labels and Schema.org types", () => {
    const cases = [
      ["article", "Article", "Article"],
      ["audio", "Audio", "AudioObject"],
      ["book", "Book", "Book"],
      ["creative-work", "Creative work", "CreativeWork"],
      ["dataset", "Dataset", "Dataset"],
      ["event", "Event", "Event"],
      ["software", "Software", "SoftwareApplication"],
      ["video", "Video", "VideoObject"],
    ] as const;

    for (const [type, label, schemaType] of cases) {
      const semantic = {
        item: {
          description: `${label} description.`,
          name: `${label} item`,
          type,
          url: "https://example.com/item",
        },
        kind: "review",
        summary: "Review summary.",
      } satisfies SemanticMetadata;

      expect(semanticDetailsViewModel(semantic)?.items).toContainEqual({
        label: "Type",
        value: label,
      });
      expect(semanticNode(semantic)).toMatchObject({
        "@type": "Review",
        itemReviewed: {
          "@type": schemaType,
          description: `${label} description.`,
          name: `${label} item`,
          url: "https://example.com/item",
        },
      });
    }
  });

  test("maps event attendance, status, and place location into Schema.org URLs", () => {
    const cases = [
      [
        "mixed",
        "cancelled",
        "https://schema.org/MixedEventAttendanceMode",
        "https://schema.org/EventCancelled",
      ],
      [
        "offline",
        "moved-online",
        "https://schema.org/OfflineEventAttendanceMode",
        "https://schema.org/EventMovedOnline",
      ],
      [
        "online",
        "postponed",
        "https://schema.org/OnlineEventAttendanceMode",
        "https://schema.org/EventPostponed",
      ],
      [
        undefined,
        "rescheduled",
        undefined,
        "https://schema.org/EventRescheduled",
      ],
      [undefined, "scheduled", undefined, "https://schema.org/EventScheduled"],
    ] as const;

    for (const [attendance, status, attendanceMode, eventStatus] of cases) {
      const node = semanticNode({
        attendance,
        endDate: new Date("2026-06-02T20:00:00.000Z"),
        kind: "event",
        location: {
          address: "1 Example Street",
          name: "Example Hall",
          type: "place",
          url: "https://example.com/hall",
        },
        name: "Launch Event",
        startDate: new Date("2026-06-01T19:00:00.000Z"),
        status,
        url: "https://example.com/event",
      });

      expect(node).toMatchObject({
        "@type": "Event",
        endDate: "2026-06-02T20:00:00.000Z",
        eventStatus,
        location: {
          "@type": "Place",
          address: "1 Example Street",
          name: "Example Hall",
          url: "https://example.com/hall",
        },
      });
      expect(node["attendanceMode"]).toBe(attendanceMode);
    }
  });
});

function semanticNode(
  semantic: Exclude<SemanticMetadata, undefined>,
): Record<string, unknown> {
  const result = semanticMetadataJsonLd(semantic, jsonLdInput());

  expect(result.references).toEqual([
    {
      "@id": `https://example.com/articles/launch-event/#semantic-${semantic.kind}`,
    },
  ]);
  expect(result.nodes).toHaveLength(1);

  return result.nodes[0] ?? {};
}

function jsonLdInput(): Parameters<typeof semanticMetadataJsonLd>[1] {
  return {
    authorName: "Author",
    canonicalPath: "/articles/launch-event/",
    datePublished: new Date("2026-05-01T00:00:00.000Z"),
    site: "https://example.com",
  };
}
