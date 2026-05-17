import { describe, expect, test } from "vitest";

import AnnouncementJsonLd from "../../../../src/components/seo/AnnouncementJsonLd.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";
import { announcementEntry } from "../../../helpers/content";

describe("AnnouncementJsonLd", () => {
  test("renders article-like JSON-LD for announcements", async () => {
    const announcement = announcementEntry({
      data: {
        author: "The Philosopher's Meme",
        description: "Announcement description.",
        tags: ["site news"],
        title: "Announcement Title",
        updated: new Date("2026-05-05T00:00:00.000Z"),
      },
      id: "announcement-title",
    });
    const container = await createAstroTestContainer();
    const view = await container.renderToString(AnnouncementJsonLd, {
      props: {
        announcement,
        image: {
          alt: "Announcement image",
          height: 630,
          src: "/_astro/social-preview.hash.jpg",
          type: "image/jpeg",
          width: 1200,
        },
      },
    });

    expect(view).toContain('"@type":"BlogPosting"');
    expect(view).toContain('"articleSection":"Announcements"');
    expect(view).toContain('"dateModified":"2026-05-05T00:00:00.000Z"');
    expect(view).toContain(
      '"url":"https://thephilosophersmeme.com/announcements/announcement-title/"',
    );
  });

  test("renders semantic event JSON-LD for announcement frontmatter", async () => {
    const announcement = announcementEntry({
      data: {
        author: "The Philosopher's Meme",
        semantic: {
          kind: "event",
          location: {
            type: "online",
            url: "https://example.com/live",
          },
          name: "Launch Event",
          startDate: new Date("2026-06-01T19:00:00.000Z"),
          status: "scheduled",
        },
        title: "Launch Announcement",
      },
      id: "launch-announcement",
    });
    const container = await createAstroTestContainer();
    const view = await container.renderToString(AnnouncementJsonLd, {
      props: { announcement },
    });

    expect(view).toContain('"@graph"');
    expect(view).toContain('"@type":"BlogPosting"');
    expect(view).toContain('"@type":"Event"');
    expect(view).toContain('"name":"Launch Event"');
    expect(view).toContain('"@type":"VirtualLocation"');
    expect(view).toContain(
      '"about":[{"@id":"https://thephilosophersmeme.com/announcements/launch-announcement/#semantic-event"}]',
    );
  });
});
