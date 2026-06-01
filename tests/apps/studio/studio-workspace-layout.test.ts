import { describe, expect, test } from "bun:test";

import { studioWorkspacePaneLayout } from "../../../apps/studio/src/components/shell/workspace-layout-policy";

describe("Studio workspace pane layout policy", () => {
  test("keeps expanded desktop panes stable", () => {
    expect(
      studioWorkspacePaneLayout({
        previewCollapsed: false,
        sidebarCollapsed: false,
      }),
    ).toEqual({
      preview: 35,
      sidebar: 22,
      work: 43,
    });
  });

  test("keeps the sidebar usable when preview is collapsed", () => {
    const layout = studioWorkspacePaneLayout({
      previewCollapsed: true,
      sidebarCollapsed: false,
    });

    expect(layout).toEqual({
      preview: 5,
      sidebar: 22,
      work: 73,
    });
    expect(layout.preview + layout.sidebar + layout.work).toBe(100);
  });

  test("keeps both rails compact without over-allocating the work pane", () => {
    const layout = studioWorkspacePaneLayout({
      previewCollapsed: true,
      sidebarCollapsed: true,
    });

    expect(layout).toEqual({
      preview: 5,
      sidebar: 5,
      work: 90,
    });
    expect(layout.preview + layout.sidebar + layout.work).toBe(100);
  });
});
