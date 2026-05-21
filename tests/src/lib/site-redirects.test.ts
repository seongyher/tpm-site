import { describe, expect, test } from "bun:test";

import {
  parseSiteRedirects,
  siteRedirects,
} from "../../../src/lib/site-redirects";

describe("site redirects", () => {
  test("keeps current site redirects normalized, unique, and non-recursive", () => {
    const entries = Object.entries(siteRedirects);
    const sources = entries.map(([source]) => source);

    expect(new Set(sources).size).toBe(sources.length);

    for (const [source, target] of entries) {
      expect(source).toMatch(/^\//u);
      expect(target).toMatch(/^(?:\/|https?:\/\/)/u);
      expect(target).not.toBe(source);
    }
  });

  test("loads current TPM legacy redirects from the site instance", () => {
    expect(siteRedirects["/2021/05/16/gamergate-as-metagaming/"]).toBe(
      "/articles/gamergate-as-metagaming/",
    );
    expect(
      siteRedirects[
        "/2021/06/14/jeremy-cahill-metamer-dismissed-for-serious-misconduct/"
      ],
    ).toBe(
      "/announcements/jeremy-cahill-metamer-dismissed-for-serious-misconduct/",
    );
  });

  test("parses empty and external redirect maps", () => {
    expect(parseSiteRedirects({})).toEqual({});
    expect(
      parseSiteRedirects({
        "/old/": "https://example.com/new/",
      }),
    ).toEqual({
      "/old/": "https://example.com/new/",
    });
  });

  test("rejects malformed redirect sources and targets with path-aware errors", () => {
    expect(() => parseSiteRedirects({ "old/": "/new/" })).toThrow(/old\//u);
    expect(() => parseSiteRedirects({ "/old/": "new/" })).toThrow(/old/u);
  });
});
