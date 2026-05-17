import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

describe("static public files", () => {
  test("serves fingerprinted Astro assets with long-lived immutable caching", async () => {
    const headers = await readFile("site/public/_headers", "utf8");

    expect(headers).toContain("/_astro/*");
    expect(headers).toContain(
      "Cache-Control: public, max-age=31556952, immutable",
    );
  });

  test("publishes a valid traffic-advice policy for private prefetch proxies", async () => {
    const policyText = await readFile(
      "site/public/.well-known/traffic-advice",
      "utf8",
    );
    const policy = JSON.parse(policyText) as unknown;

    expect(policy).toEqual([{ fraction: 1, user_agent: "prefetch-proxy" }]);
  });

  test("serves traffic-advice with an explicit Cloudflare static asset header", async () => {
    const headers = await readFile("site/public/_headers", "utf8");

    expect(headers).toContain("/.well-known/traffic-advice");
    expect(headers).toContain(
      "Content-Type: application/trafficadvice+json; charset=utf-8",
    );
    expect(headers).toContain("X-Content-Type-Options: nosniff");
  });
});
