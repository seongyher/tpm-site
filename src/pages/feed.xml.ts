import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getAuthorEntries } from "../lib/content/authors";
import { getAnnouncements, getArticles } from "../lib/content/content";
import { publishableFeedEntries } from "../lib/content/feed";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../lib/routes/routes";
import { siteConfig } from "../lib/site/site-config";

type FeedContext = Pick<APIContext, "site">;

const dublinCoreNamespace = "http://purl.org/dc/elements/1.1/";

/**
 * Generates the RSS feed endpoint from published article and announcement content.
 *
 * @param context Astro API route context with site metadata.
 * @returns RSS response for feed readers.
 */
export async function GET(context: FeedContext): Promise<Response> {
  const authors = await getAuthorEntries();
  const entries = siteConfig.features.feed
    ? publishableFeedEntries({
        announcements: await getAnnouncements(),
        articles: await getArticles(),
        authors,
      })
    : [];
  const site = context.site?.toString() ?? SITE_URL;

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: {
      dc: dublinCoreNamespace,
    },
    items: entries.map((entry) => ({
      title: entry.title,
      pubDate: entry.pubDate,
      description: entry.description,
      link: entry.href,
      customData: `<dc:creator>${escapeXmlText(entry.author)}</dc:creator>`,
    })),
    customData: "<language>en-us</language>",
  });
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
