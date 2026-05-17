import { describe, expect, test } from "bun:test";

import {
  semanticDetailsViewModel,
  semanticMetadataJsonLd,
  semanticMetadataSchema,
} from "../../../src/lib/semantic-metadata";

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
      {
        authorName: "Author",
        canonicalPath: "/articles/launch-event/",
        datePublished: new Date("2026-05-01T00:00:00.000Z"),
        site: "https://example.com",
      },
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
});
