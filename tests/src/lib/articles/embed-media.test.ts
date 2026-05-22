import { describe, expect, test } from "bun:test";

import {
  classifyEmbedMedia,
  embedFrameClassName,
  embedIframeClassName,
  soundCloudPlayerUrl,
} from "../../../../src/lib/articles/embed-media";

describe("embed media helpers", () => {
  test("classifies SoundCloud as compact audio", () => {
    expect(
      classifyEmbedMedia("https://w.soundcloud.com/player/?url=https://x"),
    ).toEqual({
      layout: "audio",
      provider: "soundcloud",
    });
    expect(embedFrameClassName("audio")).toContain("h-[110px]");
    expect(embedIframeClassName("audio")).toContain("h-full");
  });

  test("classifies YouTube as responsive video", () => {
    expect(classifyEmbedMedia("https://www.youtube.com/embed/example")).toEqual(
      {
        layout: "video",
        provider: "youtube",
      },
    );
    expect(embedFrameClassName("video")).toContain("aspect-video");
    expect(embedIframeClassName("video")).toContain("aspect-video");
  });

  test("builds SoundCloud player URLs from public source URLs", () => {
    const url = soundCloudPlayerUrl("https://soundcloud.com/example/track");

    expect(url.startsWith("https://w.soundcloud.com/player/?")).toBe(true);
    expect(url).toContain("url=https%3A%2F%2Fsoundcloud.com%2Fexample%2Ftrack");
    expect(url).toContain("auto_play=false");
  });
});
