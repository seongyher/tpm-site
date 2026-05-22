import type {
  AuthorProfile,
  AuthorSummary,
} from "../../../../src/lib/content/authors";
import { articleEntry, authorEntry } from "../../../helpers/content";

/** Structured author summary fixture used by component tests. */
export const authorSummaryFixture = {
  displayName: "Seong-Young Her",
  href: "/authors/seong-young-her/",
  id: "seong-young-her",
  shortBio: "Brief author bio.",
  type: "person",
} as const satisfies AuthorSummary;

/** Structured author profile fixture used by component tests. */
export const authorProfileFixture = {
  ...authorSummaryFixture,
  aliases: ["Seong-Young Her"],
  articles: [
    articleEntry({
      data: { author: "Seong-Young Her", title: "Article Title" },
      id: "article-title",
    }),
  ],
  entry: authorEntry({
    displayName: "Seong-Young Her",
    id: "seong-young-her",
    shortBio: "Brief author bio.",
    website: "https://example.com",
  }),
  socials: [{ href: "https://example.com/profile", label: "Profile" }],
  website: "https://example.com",
} as const satisfies AuthorProfile;
