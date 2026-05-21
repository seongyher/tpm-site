import { describe, expect, test } from "bun:test";

import { verifyFeedXml } from "../../../../scripts/build/verify-build/feed-verifier";

describe("feed verifier", () => {
  test("reports RSS item enclosures because social metadata owns image discovery", () => {
    expect(
      verifyFeedXml({
        relativePath: "feed.xml",
        xml: '<rss><channel><item><enclosure url="/image.jpg" /></item></channel></rss>',
      }).map((diagnostic) => diagnostic.message),
    ).toEqual(["feed.xml: RSS feed must not include item enclosures; found 1"]);
  });

  test("accepts feeds without enclosures", () => {
    expect(
      verifyFeedXml({
        relativePath: "feed.xml",
        xml: "<rss><channel><item><title>Post</title></item></channel></rss>",
      }),
    ).toEqual([]);
  });
});
