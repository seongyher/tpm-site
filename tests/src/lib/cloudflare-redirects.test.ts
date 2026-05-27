import { describe, expect, test } from "bun:test";

import { formatCloudflareRedirects } from "../../../src/lib/cloudflare-redirects";

describe("Cloudflare redirects", () => {
  test("formats a deterministic static assets redirects file", () => {
    expect(
      formatCloudflareRedirects([
        {
          destination: "/articles/current/",
          source: "/2015/11/25/legacy/",
        },
      ]),
    ).toBe(
      [
        "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.",
        "/2015/11/25/legacy/ /articles/current/ 301",
        "",
      ].join("\n"),
    );
  });
});
