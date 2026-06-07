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
      preview: {
        defaultSize: 35,
        minSize: 24,
      },
      sidebar: {
        defaultSize: 20,
        maxSize: 30,
        minSize: 16,
      },
      work: {
        defaultSize: 45,
        minSize: 28,
      },
    });
  });

  test("removes hidden preview from the layout", () => {
    const layout = studioWorkspacePaneLayout({
      previewVisible: false,
      sidebarVisible: true,
    });

    expect(layout).toEqual({
      sidebar: {
        defaultSize: 20,
        maxSize: 30,
        minSize: 16,
      },
      work: {
        defaultSize: 80,
        minSize: 28,
      },
    });
    expect(defaultTotal(layout)).toBe(100);
  });

  test("removes hidden sidebar and preview from the layout", () => {
    const layout = studioWorkspacePaneLayout({
      previewVisible: false,
      sidebarVisible: false,
    });

    expect(layout).toEqual({
      work: {
        defaultSize: 100,
        minSize: 28,
      },
    });
    expect(defaultTotal(layout)).toBe(100);
  });

  test("keeps pane minimums compatible when all panes are visible", () => {
    const layout = studioWorkspacePaneLayout({
      previewVisible: true,
      sidebarVisible: true,
    });

    expect(minimumTotal(layout)).toBeLessThanOrEqual(100);
    expect(layout.sidebar?.maxSize).toBeGreaterThanOrEqual(
      layout.sidebar?.minSize ?? 0,
    );
  });
});

function defaultTotal(
  layout: ReturnType<typeof studioWorkspacePaneLayout>,
): number {
  return (
    (layout.preview?.defaultSize ?? 0) +
    (layout.sidebar?.defaultSize ?? 0) +
    layout.work.defaultSize
  );
}

function minimumTotal(
  layout: ReturnType<typeof studioWorkspacePaneLayout>,
): number {
  return (
    (layout.preview?.minSize ?? 0) +
    (layout.sidebar?.minSize ?? 0) +
    layout.work.minSize
  );
}
