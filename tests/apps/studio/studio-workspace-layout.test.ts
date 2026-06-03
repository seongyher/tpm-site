import { describe, expect, test } from "bun:test";

import { studioWorkspacePaneLayout } from "../../../apps/studio/src/components/shell/workspace-layout-policy";

describe("Studio workspace pane layout policy", () => {
  test("keeps visible desktop panes stable", () => {
    expect(
      studioWorkspacePaneLayout({
        previewVisible: true,
        sidebarVisible: true,
      }),
    ).toEqual({
      preview: 35,
      sidebar: 20,
      work: 45,
    });
  });

  test("removes hidden preview from the layout", () => {
    const layout = studioWorkspacePaneLayout({
      previewVisible: false,
      sidebarVisible: true,
    });

    expect(layout).toEqual({
      sidebar: 20,
      work: 80,
    });
    expect((layout.preview ?? 0) + (layout.sidebar ?? 0) + layout.work).toBe(
      100,
    );
  });

  test("removes hidden sidebar and preview from the layout", () => {
    const layout = studioWorkspacePaneLayout({
      previewVisible: false,
      sidebarVisible: false,
    });

    expect(layout).toEqual({
      work: 100,
    });
    expect((layout.preview ?? 0) + (layout.sidebar ?? 0) + layout.work).toBe(
      100,
    );
  });
});
