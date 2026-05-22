import { describe, expect, test } from "bun:test";

import {
  announcementDirectoryListItems,
  announcementListItem,
  announcementListItems,
} from "../../../../src/lib/content/announcements";
import { defaultPublishableVisibility } from "../../../../src/lib/content/publishable";
import { announcementEntry } from "../../../helpers/content";

describe("announcement list helpers", () => {
  test("maps announcements into shared article-list display items", () => {
    const announcement = announcementEntry({
      data: {
        description: "Talk with TPM readers.",
        image: { format: "png", height: 300, src: "/discord.png", width: 600 },
        imageAlt: "Discord preview",
        title: "Join Discord",
      },
      date: new Date("2026-05-05T00:00:00Z"),
      id: "discord-community",
    });

    expect(announcementListItem(announcement)).toMatchObject({
      author: "The Philosopher's Meme",
      date: "May 5, 2026",
      description: "Talk with TPM readers.",
      href: "/announcements/discord-community/",
      image: {
        alt: "Discord preview",
        src: { format: "png", height: 300, src: "/discord.png", width: 600 },
      },
      kind: "announcement",
      title: "Join Discord",
    });
  });

  test("uses title as image alt fallback and maps multiple announcements", () => {
    const announcement = announcementEntry({
      data: {
        image: { format: "png", height: 300, src: "/forum.png", width: 600 },
        title: "Forum Build Priority",
      },
      id: "forum-build-priority",
    });

    expect(announcementListItems([announcement])[0]?.image).toEqual({
      alt: "Forum Build Priority",
      src: { format: "png", height: 300, src: "/forum.png", width: 600 },
    });
  });

  test("filters directory-hidden announcements for public announcement lists", () => {
    const visible = announcementEntry({
      data: {
        title: "Visible Update",
      },
      id: "visible-update",
    });
    const hidden = announcementEntry({
      data: {
        title: "Off-Site Update",
        visibility: {
          ...defaultPublishableVisibility,
          directory: false,
          feed: false,
          homepage: false,
          search: false,
        },
      },
      id: "off-site-update",
    });

    const items = announcementDirectoryListItems([visible, hidden]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      href: "/announcements/visible-update/",
      title: "Visible Update",
    });
  });
});
