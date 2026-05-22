import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { createPlatformEntrypointConsumerReport } from "../../../examples/platform-entrypoint-consumer/platform-consumer";

const exampleConsumerPath =
  "examples/platform-entrypoint-consumer/platform-consumer.ts";

describe("platform entrypoint example consumer", () => {
  test("runs selected platform domains without live TPM site imports", () => {
    const report = createPlatformEntrypointConsumerReport();

    expect(report).toEqual({
      citationIdentity: "doi:10.1086/288811",
      diagnosticIdentity: "warning|metadata.example|/example/",
      embedProvider: "youtube",
      interactionScripts: report.interactionScripts,
      mediaAlt: "Example diagram.",
      placement: "bottom-end",
      routeOutputPath: "articles/example",
    });
    expect(report.interactionScripts).toContain(
      "src/scripts/anchored-positioning.ts",
    );
  });

  test("keeps the example consumer free of site-specific imports and copy", () => {
    const source = readFileSync(exampleConsumerPath, "utf8");

    expect(source).toContain("../../src/platform/");
    expect(source).not.toMatch(
      /@site\/|from ["'][^"']*\/site\/|The Philosopher'?s Meme|thephilosophersmeme|philo_meme|patreon\.com\/thephilosophersmeme/iu,
    );
  });
});
