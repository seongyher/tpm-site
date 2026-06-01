import {
  type DiagnosticFixture,
  type FieldDescriptorFixture,
  type FieldSectionFixture,
  type ProviderSummaryFixture,
  STUDIO_MVP_FIXTURE_SCHEMA_VERSION,
  type StudioMvpFixture,
} from "../../models/studio-fixtures";

const sourceProvider = {
  capabilities: ["source.read", "source.plan-write", "source.apply-write"],
  family: "source",
  id: "local-source",
  label: "Local site folder",
  status: "available",
} as const satisfies ProviderSummaryFixture;

const historyProvider = {
  capabilities: [
    "history.list-checkpoints",
    "history.create-checkpoint",
    "history.restore-plan",
  ],
  family: "history",
  id: "local-checkpoints",
  label: "Local checkpoints",
  status: "available",
} as const satisfies ProviderSummaryFixture;

const mediaProvider = {
  capabilities: ["media.list", "media.metadata.patch", "media.insert"],
  family: "media",
  id: "local-media",
  label: "Local media folder",
  status: "available",
} as const satisfies ProviderSummaryFixture;

const deployProvider = {
  capabilities: ["publish.plan", "publish.apply", "preview.route"],
  family: "deploy",
  id: "cloudflare-workers",
  label: "Cloudflare Workers",
  status: "available",
} as const satisfies ProviderSummaryFixture;

const diagnostics = [
  {
    blocksAction: true,
    code: "STUDIO-ARTICLE-TITLE-REQUIRED",
    location: {
      collection: "articles",
      fieldPath: "title",
      kind: "source",
      path: "site/content/articles/workshop/how-to-build-a-writing-desk.md",
    },
    message: "Add a title before publishing this article.",
    nextActionId: "editor.focus-title",
    remediation: "Enter a title in Article settings.",
    severity: "error",
  },
  {
    blocksAction: false,
    code: "STUDIO-ARTICLE-UNSUPPORTED-MDX",
    location: {
      collection: "articles",
      kind: "source",
      path: "site/content/articles/advanced/custom-mdx-demo.mdx",
    },
    message:
      "This article uses a custom MDX component that the source editor cannot preview inline yet.",
    remediation:
      "Edit the source directly, then use Preview to verify the rendered route.",
    severity: "warning",
  },
  {
    blocksAction: false,
    code: "STUDIO-MEDIA-MISSING-ALT",
    location: {
      fieldPath: "alt",
      kind: "source",
      path: "site/assets/articles/workshop/desk-sketch.jpg",
    },
    message: "This image needs descriptive alt text.",
    nextActionId: "media.focus-alt",
    remediation: "Add a short description of the meaningful image content.",
    severity: "warning",
  },
  {
    blocksAction: true,
    code: "STUDIO-MEDIA-MISSING-SOURCE",
    location: {
      kind: "source",
      path: "site/assets/articles/workshop/missing-joinery-photo.jpg",
    },
    message: "The media source file is missing.",
    nextActionId: "media.replace",
    remediation: "Replace the image or remove references to it.",
    severity: "error",
  },
  {
    blocksAction: false,
    code: "STUDIO-MEDIA-UNSUPPORTED-FORMAT",
    location: {
      kind: "source",
      path: "site/assets/articles/workshop/raw-board-plan.tiff",
    },
    message:
      "This image format is not supported by the current preview pipeline.",
    remediation: "Replace it with a PNG, JPEG, WebP, AVIF, or SVG asset.",
    severity: "warning",
  },
  {
    blocksAction: true,
    code: "STUDIO-SETTINGS-SITE-URL-INVALID",
    location: {
      fieldPath: "siteUrl",
      kind: "source",
      path: "site/config/site.json",
    },
    message: "Enter a valid site URL before publishing.",
    nextActionId: "settings.focus-site-url",
    remediation: "Use a complete URL such as https://northwindjournal.com.",
    severity: "error",
  },
  {
    blocksAction: true,
    code: "STUDIO-PREVIEW-BLOCKED",
    location: {
      fieldPath: "title",
      kind: "source",
      path: "site/content/articles/workshop/how-to-build-a-writing-desk.md",
    },
    message: "Preview is blocked until the article title is valid.",
    nextActionId: "editor.focus-title",
    remediation: "Add a title and try Preview again.",
    severity: "error",
  },
  {
    blocksAction: false,
    code: "STUDIO-PREVIEW-FAILED",
    location: {
      kind: "artifact",
      path: "dist/articles/how-to-build-a-writing-desk/index.html",
    },
    message: "Preview rendering failed before producing a route artifact.",
    remediation: "Retry Preview. If it fails again, run the site check.",
    severity: "warning",
  },
  {
    blocksAction: true,
    code: "STUDIO-PUBLISH-MISSING-CLOUDFLARE",
    message: "Connect Cloudflare before publishing this site.",
    nextActionId: "credentials.connect-cloudflare",
    remediation: "Open Publishing settings and connect a Cloudflare account.",
    severity: "error",
  },
  {
    blocksAction: false,
    code: "STUDIO-PUBLISH-FAILED",
    location: {
      kind: "operation",
      path: "publish.apply",
    },
    message:
      "Cloudflare rejected the publish request after the preview was confirmed.",
    remediation: "Retry publish. If it fails again, reconnect Cloudflare.",
    severity: "warning",
  },
  {
    blocksAction: false,
    code: "STUDIO-RESTORE-UNAVAILABLE",
    location: {
      kind: "operation",
      path: "history.checkpoints",
    },
    message: "Checkpoint history is not available for this project.",
    remediation: "Connect a history provider or enable local checkpoints.",
    severity: "warning",
  },
] as const satisfies readonly DiagnosticFixture[];

const articleIdentityFields = [
  field({
    effects: ["metadata", "route", "search", "sitemap", "social-preview"],
    id: "title",
    input: "text",
    label: "Title",
    path: "title",
    required: true,
    value: "How to Build a Writing Desk",
  }),
  field({
    effects: ["metadata", "search", "social-preview"],
    id: "description",
    input: "textarea",
    label: "Description",
    path: "description",
    required: true,
    value:
      "A simple, sturdy writing desk can transform the way you work and think.",
  }),
  field({
    effects: ["metadata", "feed"],
    id: "author",
    input: "select",
    label: "Author",
    path: "author",
    required: true,
    value: "Ava Brooks",
  }),
  field({
    effects: ["feed", "metadata", "sitemap"],
    id: "date",
    input: "date",
    label: "Date",
    path: "date",
    required: true,
    value: "2026-05-14",
  }),
] as const satisfies readonly FieldDescriptorFixture[];

const articleTaxonomyFields = [
  field({
    effects: ["homepage", "metadata", "route", "search"],
    id: "category",
    input: "select",
    label: "Category",
    path: "category",
    required: true,
    value: "Workshop",
  }),
  field({
    effects: ["metadata", "search"],
    id: "tags",
    input: "multi-select",
    label: "Tags",
    path: "tags",
    required: false,
    value: ["woodworking", "home", "tools"],
  }),
  field({
    effects: ["accessibility", "metadata", "search", "social-preview"],
    id: "featuredImage",
    input: "image-reference",
    label: "Featured image",
    path: "featuredImage",
    required: true,
    value: "media-writing-desk-hero",
  }),
] as const satisfies readonly FieldDescriptorFixture[];

const validArticleSections = [
  { fields: articleIdentityFields, id: "identity", label: "Identity" },
  { fields: articleTaxonomyFields, id: "taxonomy", label: "Taxonomy" },
] as const satisfies readonly FieldSectionFixture[];

const invalidArticleSections = [
  {
    fields: [
      field({
        diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
        draftValue: "",
        effects: ["metadata", "route", "search", "sitemap", "social-preview"],
        id: "title",
        input: "text",
        label: "Title",
        path: "title",
        required: true,
        status: "invalid",
        value: "How to Build a Writing Desk",
      }),
      ...articleIdentityFields.slice(1),
    ],
    id: "identity",
    label: "Identity",
  },
  { fields: articleTaxonomyFields, id: "taxonomy", label: "Taxonomy" },
] as const satisfies readonly FieldSectionFixture[];

/** Operation-shaped Studio GUI MVP fixture used by the prototype. */
export const studioMvpFixture = {
  articles: [
    {
      body: {
        format: "markdown",
        readTimeLabel: "7 min read",
        source:
          "# How to Build a Writing Desk\n\nA simple, sturdy writing desk can transform the way you work and think.\n\n## Planning Your Desk\nBefore cutting any wood, take time to plan.\n\n- Measure your space\n- Decide on dimensions\n- Sketch a simple plan\n- Choose your materials\n\n![Writing desk in workshop](writing-desk-hero.jpg)\n\n## Materials & Tools\nHere's what you'll need for this build.\n",
        wordCountLabel: "1,024 words",
      },
      canonicalState: "valid",
      checkpoints: [
        {
          createdLabel: "Today, 9:41 AM",
          id: "checkpoint-writing-desk-autosave",
          label: "Before latest edits",
          sourceRef: {
            kind: "operation",
            path: "history.checkpoints.checkpoint-writing-desk-autosave",
          },
        },
        {
          createdLabel: "Yesterday, 4:18 PM",
          id: "checkpoint-writing-desk-draft",
          label: "Draft saved",
          sourceRef: {
            kind: "operation",
            path: "history.checkpoints.checkpoint-writing-desk-draft",
          },
        },
      ],
      diagnostics: [],
      frontmatter: validArticleSections,
      id: "article-writing-desk",
      route: "/articles/how-to-build-a-writing-desk/",
      sourceRef: {
        collection: "articles",
        kind: "source",
        path: "site/content/articles/workshop/how-to-build-a-writing-desk.md",
      },
      title: "How to Build a Writing Desk",
      workingCopyState: "clean",
    },
    {
      body: {
        format: "markdown",
        readTimeLabel: "5 min read",
        source:
          "# Small Shop Organization Ideas\n\nA compact shop can still feel calm when tools have obvious homes.\n",
        wordCountLabel: "720 words",
      },
      canonicalState: "valid",
      checkpoints: [],
      diagnostics: [],
      frontmatter: validArticleSections,
      id: "article-small-shop",
      route: "/articles/small-shop-organization-ideas/",
      sourceRef: {
        collection: "articles",
        kind: "source",
        path: "site/content/articles/workshop/small-shop-organization-ideas.md",
      },
      title: "Small Shop Organization Ideas",
      workingCopyState: "dirty",
    },
    {
      body: {
        format: "markdown",
        readTimeLabel: "6 min read",
        source:
          "# Choosing the Right Wood\n\nWood choice affects durability, finish, and the feeling of the finished piece.\n",
        wordCountLabel: "880 words",
      },
      canonicalState: "valid",
      checkpoints: [],
      diagnostics: [diagnostics[3]],
      frontmatter: validArticleSections,
      id: "article-choosing-wood",
      route: "/articles/choosing-the-right-wood/",
      sourceRef: {
        collection: "articles",
        kind: "source",
        path: "site/content/articles/workshop/choosing-the-right-wood.md",
      },
      title: "Choosing the Right Wood",
      workingCopyState: "saved",
    },
    {
      body: {
        format: "mdx",
        readTimeLabel: "4 min read",
        source:
          '# Custom Bench Notes\n\n<BenchDiagram variant="compact" />\n\nThis MDX article demonstrates unsupported inline preview behavior.\n',
        unsupportedDiagnosticCode: "STUDIO-ARTICLE-UNSUPPORTED-MDX",
        wordCountLabel: "530 words",
      },
      canonicalState: "valid",
      checkpoints: [],
      diagnostics: [diagnostics[1]],
      frontmatter: validArticleSections,
      id: "article-custom-mdx",
      route: "/articles/custom-bench-notes/",
      sourceRef: {
        collection: "articles",
        kind: "source",
        path: "site/content/articles/advanced/custom-mdx-demo.mdx",
      },
      title: "Custom Bench Notes",
      workingCopyState: "clean",
    },
    {
      body: {
        format: "markdown",
        readTimeLabel: "7 min read",
        source:
          "# How to Build a Writing Desk\n\nThis working copy intentionally has an empty title field in metadata.\n",
        wordCountLabel: "1,024 words",
      },
      canonicalState: "valid",
      checkpoints: [],
      diagnostics: [diagnostics[0]],
      frontmatter: invalidArticleSections,
      id: "article-writing-desk-invalid",
      route: "/articles/how-to-build-a-writing-desk/",
      sourceRef: {
        collection: "articles",
        kind: "source",
        path: "site/content/articles/workshop/how-to-build-a-writing-desk.md",
      },
      title: "How to Build a Writing Desk",
      workingCopyState: "invalid",
    },
  ],
  articleDirectories: [
    {
      availableCategories: ["Workshop", "Tools", "Design"],
      availableTags: ["woodworking", "home", "tools", "storage"],
      id: "directory-populated",
      query: "",
      results: [
        directoryResult(
          "article-writing-desk",
          "draft",
          "media-writing-desk-hero",
        ),
        directoryResult("article-small-shop", "draft", "media-pegboard-tools"),
        directoryResult(
          "article-choosing-wood",
          "missing-media",
          "media-missing-source",
        ),
      ],
      statusFilter: "all",
    },
    {
      availableCategories: ["Workshop", "Tools", "Design"],
      availableTags: ["woodworking", "home", "tools", "storage"],
      categoryFilter: "Workshop",
      id: "directory-filtered",
      query: "",
      results: [
        directoryResult(
          "article-writing-desk",
          "draft",
          "media-writing-desk-hero",
        ),
        directoryResult("article-small-shop", "draft", "media-pegboard-tools"),
      ],
      statusFilter: "drafts",
    },
    {
      availableCategories: ["Workshop", "Tools", "Design"],
      availableTags: ["woodworking", "home", "tools", "storage"],
      id: "directory-search-results",
      query: "desk",
      results: [
        directoryResult(
          "article-writing-desk",
          "draft",
          "media-writing-desk-hero",
        ),
      ],
      statusFilter: "all",
    },
    {
      availableCategories: ["Workshop", "Tools", "Design"],
      availableTags: ["woodworking", "home", "tools", "storage"],
      emptyState: "no-filter-results",
      id: "directory-no-results",
      query: "luthiery",
      results: [],
      statusFilter: "all",
    },
    {
      availableCategories: [],
      availableTags: [],
      emptyState: "no-articles",
      id: "directory-empty",
      query: "",
      results: [],
      statusFilter: "all",
    },
  ],
  credentials: [
    {
      id: "credential-cloudflare-connected",
      label: "Cloudflare production token",
      lastVerifiedAt: "2026-05-29T13:41:00.000Z",
      providerId: "cloudflare-workers",
      scopes: ["workers:write", "workers:read", "account:read"],
      state: "connected",
    },
    {
      id: "credential-cloudflare-missing",
      label: "Cloudflare connection",
      providerId: "cloudflare-workers",
      scopes: [],
      state: "missing",
    },
  ],
  diagnostics,
  generatedFor: "studio-gui-mvp",
  media: {
    items: [
      {
        altText: "Minimal solid wood writing desk in a bright workshop",
        caption: "A simple writing desk made from solid hardwood.",
        dimensions: { height: 900, width: 1600 },
        displayName: "writing-desk-hero.jpg",
        fileSizeLabel: "420 KB",
        fullUrl: "/fixtures/studio/media/writing-desk-hero.svg",
        id: "media-writing-desk-hero",
        kind: "image",
        sourceRef: {
          kind: "source",
          path: "site/assets/articles/workshop/writing-desk-hero.jpg",
        },
        status: "ready",
        thumbnailUrl: "/fixtures/studio/media/writing-desk-hero.svg",
        usage: [
          {
            articleId: "article-writing-desk",
            locationLabel: "/articles/how-to-build-a-writing-desk/",
            title: "How to Build a Writing Desk",
          },
        ],
      },
      {
        altText: "Pegboard with hand tools arranged above a workbench",
        dimensions: { height: 1067, width: 1600 },
        displayName: "pegboard-tools.jpg",
        fileSizeLabel: "386 KB",
        fullUrl: "/fixtures/studio/media/pegboard-tools.svg",
        id: "media-pegboard-tools",
        kind: "image",
        sourceRef: {
          kind: "source",
          path: "site/assets/articles/workshop/pegboard-tools.jpg",
        },
        status: "ready",
        thumbnailUrl: "/fixtures/studio/media/pegboard-tools.svg",
        usage: [
          {
            articleId: "article-small-shop",
            locationLabel: "/articles/small-shop-organization-ideas/",
            title: "Small Shop Organization Ideas",
          },
        ],
      },
      {
        altText: "",
        dimensions: { height: 1067, width: 1600 },
        diagnosticCode: "STUDIO-MEDIA-MISSING-ALT",
        displayName: "desk-sketch.jpg",
        fileSizeLabel: "210 KB",
        fullUrl: "/fixtures/studio/media/desk-sketch.svg",
        id: "media-desk-sketch-missing-alt",
        kind: "image",
        sourceRef: {
          kind: "source",
          path: "site/assets/articles/workshop/desk-sketch.jpg",
        },
        status: "missing-alt",
        thumbnailUrl: "/fixtures/studio/media/desk-sketch.svg",
        usage: [
          {
            articleId: "article-writing-desk",
            locationLabel: "Materials & Tools",
            title: "How to Build a Writing Desk",
          },
        ],
      },
      {
        altText: "Missing joinery photo",
        diagnosticCode: "STUDIO-MEDIA-MISSING-SOURCE",
        displayName: "missing-joinery-photo.jpg",
        fullUrl: "/fixtures/studio/media/missing-image.svg",
        id: "media-missing-source",
        kind: "image",
        sourceRef: {
          kind: "source",
          path: "site/assets/articles/workshop/missing-joinery-photo.jpg",
        },
        status: "missing",
        thumbnailUrl: "/fixtures/studio/media/missing-image.svg",
        usage: [
          {
            articleId: "article-choosing-wood",
            locationLabel: "/articles/choosing-the-right-wood/",
            title: "Choosing the Right Wood",
          },
        ],
      },
      {
        altText: "Unsupported raw board plan",
        diagnosticCode: "STUDIO-MEDIA-UNSUPPORTED-FORMAT",
        displayName: "raw-board-plan.tiff",
        fullUrl: "/fixtures/studio/media/unsupported-image.svg",
        id: "media-unsupported-format",
        kind: "image",
        sourceRef: {
          kind: "source",
          path: "site/assets/articles/workshop/raw-board-plan.tiff",
        },
        status: "unsupported",
        thumbnailUrl: "/fixtures/studio/media/unsupported-image.svg",
        usage: [],
      },
    ],
    query: "",
    selectedMediaId: "media-writing-desk-hero",
    viewMode: "grid",
  },
  navigation: {
    articleTree: [
      {
        children: [
          {
            articleId: "article-writing-desk",
            id: "tree-writing-desk",
            kind: "article",
            sourceRef: {
              collection: "articles",
              kind: "source",
              path: "site/content/articles/workshop/how-to-build-a-writing-desk.md",
            },
            status: "draft",
            title: "How to Build a Writing Desk",
          },
          {
            articleId: "article-small-shop",
            id: "tree-small-shop",
            kind: "article",
            status: "dirty",
            title: "Small Shop Organization Ideas",
          },
          {
            articleId: "article-choosing-wood",
            id: "tree-choosing-wood",
            kind: "article",
            status: "missing-media",
            title: "Choosing the Right Wood",
          },
        ],
        id: "tree-workshop-folder",
        kind: "folder",
        title: "Workshop",
      },
    ],
    primaryItems: [
      navItem("articles", "Articles", "article-directory", "nav.open-articles"),
      navItem("media", "Media", "media", "nav.open-media"),
      navItem("settings", "Settings", "settings", "nav.open-settings"),
    ],
  },
  previews: [
    {
      diagnostics: [],
      id: "preview-ready",
      lastRenderedAt: "Just now",
      route: "/articles/how-to-build-a-writing-desk/",
      startedFrom: "article",
      status: "ready",
    },
    {
      diagnostics: [],
      id: "preview-home-ready",
      lastRenderedAt: "Just now",
      route: "/",
      startedFrom: "home",
      status: "ready",
    },
    {
      diagnostics: [],
      id: "preview-stale",
      lastRenderedAt: "2 minutes ago",
      route: "/articles/how-to-build-a-writing-desk/",
      startedFrom: "article",
      status: "stale",
    },
    {
      diagnostics: [],
      id: "preview-loading",
      route: "/articles/how-to-build-a-writing-desk/",
      startedFrom: "article",
      status: "loading",
    },
    {
      diagnostics: [diagnostics[6]],
      id: "preview-blocked",
      route: "/articles/how-to-build-a-writing-desk/",
      startedFrom: "article",
      status: "blocked",
    },
    {
      diagnostics: [diagnostics[7]],
      id: "preview-failed",
      route: "/articles/how-to-build-a-writing-desk/",
      startedFrom: "manual-route",
      status: "failed",
    },
  ],
  publishes: [
    {
      credentialId: "credential-cloudflare-connected",
      credentialState: "connected",
      diagnostics: [],
      id: "publish-preview",
      plan: publishPlan(),
      status: "preview-ready",
      targetProvider: deployProvider,
    },
    {
      credentialId: "credential-cloudflare-connected",
      credentialState: "connected",
      diagnostics: [],
      id: "publish-confirm",
      plan: publishPlan(),
      status: "confirm-open",
      targetProvider: deployProvider,
    },
    {
      credentialId: "credential-cloudflare-connected",
      credentialState: "connected",
      diagnostics: [],
      id: "publish-progress",
      plan: publishPlan(),
      status: "publishing",
      targetProvider: deployProvider,
    },
    {
      credentialId: "credential-cloudflare-connected",
      credentialState: "connected",
      diagnostics: [],
      id: "publish-success",
      plan: publishPlan(),
      result: {
        completedLabel: "Published just now",
        publishedUrl: "https://northwindjournal.com",
        releaseId: "release-2026-05-29-1741",
      },
      status: "published",
      targetProvider: deployProvider,
    },
    {
      credentialId: "credential-cloudflare-missing",
      credentialState: "missing",
      diagnostics: [diagnostics[8]],
      id: "publish-blocked",
      status: "blocked",
      targetProvider: deployProvider,
    },
    {
      credentialId: "credential-cloudflare-connected",
      credentialState: "connected",
      diagnostics: [diagnostics[9]],
      id: "publish-failed",
      plan: publishPlan(),
      status: "failed",
      targetProvider: deployProvider,
    },
  ],
  restoreFlows: [
    {
      articleId: "article-writing-desk",
      diagnostics: [],
      id: "restore-ready",
      selectedCheckpointId: "checkpoint-writing-desk-autosave",
      status: "ready",
    },
    {
      articleId: "article-writing-desk",
      diagnostics: [],
      id: "restore-draft-selected",
      selectedCheckpointId: "checkpoint-writing-desk-draft",
      status: "ready",
    },
    {
      articleId: "article-writing-desk",
      diagnostics: [],
      id: "restore-confirm",
      selectedCheckpointId: "checkpoint-writing-desk-draft",
      status: "confirm-open",
    },
    {
      articleId: "article-writing-desk",
      diagnostics: [],
      id: "restore-restored",
      selectedCheckpointId: "checkpoint-writing-desk-draft",
      status: "restored",
    },
    {
      articleId: "article-writing-desk",
      diagnostics: [diagnostics[10]],
      id: "restore-unavailable",
      selectedCheckpointId: "checkpoint-writing-desk-draft",
      status: "unavailable",
    },
  ],
  schemaVersion: STUDIO_MVP_FIXTURE_SCHEMA_VERSION,
  screenStates: [
    screen(
      "first-launch",
      "first-launch",
      "First launch",
      "session-first-launch",
      ["workspace.discover"],
    ),
    screen(
      "recent-projects",
      "recent-projects",
      "Recent projects",
      "session-recent",
      ["workspace.discover", "session.restore"],
    ),
    screen(
      "restore-failure",
      "recent-projects",
      "Restore failure",
      "session-restore-failure",
      ["workspace.discover", "session.restore"],
    ),
    screen(
      "project-home",
      "project-home",
      "Project home",
      "session-project-home",
      ["source.inventory", "providers.inspect"],
    ),
    screen(
      "article-directory-populated",
      "article-directory",
      "Article directory populated",
      "session-directory-populated",
      ["source.inventory"],
    ),
    screen(
      "article-directory-filtered",
      "article-directory",
      "Article directory filtered",
      "session-directory-filtered",
      ["source.inventory"],
    ),
    screen(
      "article-directory-search-results",
      "article-directory",
      "Article directory search",
      "session-directory-search",
      ["source.inventory"],
    ),
    screen(
      "article-directory-no-results",
      "article-directory",
      "Article directory no results",
      "session-directory-no-results",
      ["source.inventory"],
    ),
    screen(
      "article-directory-empty",
      "article-directory",
      "Article directory empty",
      "session-directory-empty",
      ["source.inventory"],
    ),
    screen(
      "article-editor-clean",
      "article-editor",
      "Article editor clean",
      "session-editor-clean",
      ["editor.document", "preview.route"],
    ),
    screen(
      "article-editor-dirty",
      "article-editor",
      "Article editor dirty",
      "session-editor-dirty",
      ["editor.patch", "editor.validate"],
    ),
    screen(
      "article-editor-invalid",
      "article-editor",
      "Article editor invalid",
      "session-editor-invalid",
      ["editor.validate"],
    ),
    screen(
      "article-editor-unsupported-body",
      "article-editor",
      "Article editor unsupported body",
      "session-editor-unsupported",
      ["editor.document", "preview.route"],
    ),
    screen("media-browser", "media", "Media browser", "session-media-browser", [
      "media.resolve",
    ]),
    screen(
      "media-selected",
      "media",
      "Selected media",
      "session-media-selected",
      ["media.resolve"],
    ),
    screen(
      "media-missing-alt",
      "media",
      "Media missing alt",
      "session-media-missing-alt",
      ["media.patch", "media.resolve"],
    ),
    screen(
      "settings-saved",
      "settings",
      "Settings saved",
      "session-settings-saved",
      ["editor.validate"],
    ),
    screen(
      "settings-dirty",
      "settings",
      "Settings dirty",
      "session-settings-dirty",
      ["editor.patch"],
    ),
    screen(
      "settings-invalid",
      "settings",
      "Settings invalid",
      "session-settings-invalid",
      ["editor.validate"],
    ),
    screen(
      "preview-ready",
      "article-editor",
      "Preview ready",
      "session-preview-ready",
      ["preview.route"],
    ),
    screen(
      "preview-stale",
      "article-editor",
      "Preview stale",
      "session-preview-stale",
      ["preview.route"],
    ),
    screen(
      "preview-loading",
      "article-editor",
      "Preview loading",
      "session-preview-loading",
      ["preview.route"],
    ),
    screen(
      "preview-blocked",
      "article-editor",
      "Preview blocked",
      "session-preview-blocked",
      ["preview.route"],
    ),
    screen(
      "preview-failed",
      "article-editor",
      "Preview failed",
      "session-preview-failed",
      ["preview.route"],
    ),
    screen(
      "publish-preview",
      "publish-preview",
      "Publish preview",
      "session-publish-preview",
      ["publish.plan"],
    ),
    screen(
      "publish-confirm",
      "publish-preview",
      "Publish confirm",
      "session-publish-confirm",
      ["publish.plan", "publish.apply"],
    ),
    screen(
      "publish-progress",
      "publish-preview",
      "Publish progress",
      "session-publish-progress",
      ["publish.apply"],
    ),
    screen(
      "publish-success",
      "publish-preview",
      "Publish success",
      "session-publish-success",
      ["publish.apply"],
    ),
    screen(
      "publish-blocked",
      "publish-preview",
      "Publish blocked",
      "session-publish-blocked",
      ["credentials.inspect", "publish.plan"],
    ),
    screen(
      "publish-failed",
      "publish-preview",
      "Publish failed",
      "session-publish-failed",
      ["publish.apply"],
    ),
    screen(
      "restore-checkpoints",
      "restore",
      "Restore checkpoints",
      "session-restore-checkpoints",
      ["history.checkpoints", "history.restore"],
    ),
    screen(
      "restore-confirm",
      "restore",
      "Restore confirmation",
      "session-restore-confirm",
      ["history.checkpoints", "history.restore"],
    ),
    screen(
      "restore-restored",
      "restore",
      "Restore complete",
      "session-restore-restored",
      ["history.restore"],
    ),
    screen(
      "restore-unavailable",
      "restore",
      "Restore unavailable",
      "session-restore-unavailable",
      ["history.checkpoints"],
    ),
  ],
  sessions: [
    session("session-first-launch", "first-launch", "restored"),
    session("session-recent", "recent-projects", "restored"),
    session("session-restore-failure", "recent-projects", "project-missing"),
    session("session-project-home", "project-home", "restored"),
    session("session-directory-populated", "article-directory", "restored", {
      directoryId: "directory-populated",
    }),
    session("session-directory-filtered", "article-directory", "restored", {
      directoryId: "directory-filtered",
    }),
    session("session-directory-search", "article-directory", "restored", {
      directoryId: "directory-search-results",
    }),
    session("session-directory-no-results", "article-directory", "restored", {
      directoryId: "directory-no-results",
    }),
    session("session-directory-empty", "article-directory", "restored", {
      directoryId: "directory-empty",
    }),
    session("session-editor-clean", "article-editor", "restored", {
      articleId: "article-writing-desk",
      previewId: "preview-ready",
    }),
    session("session-editor-dirty", "article-editor", "restored", {
      articleId: "article-small-shop",
      previewId: "preview-stale",
    }),
    session("session-editor-invalid", "article-editor", "restored", {
      articleId: "article-writing-desk-invalid",
      previewId: "preview-blocked",
    }),
    session("session-editor-unsupported", "article-editor", "restored", {
      articleId: "article-custom-mdx",
      previewId: "preview-ready",
    }),
    session("session-media-browser", "media", "restored"),
    session("session-media-selected", "media", "restored", {
      mediaId: "media-writing-desk-hero",
    }),
    session("session-media-missing-alt", "media", "restored", {
      mediaId: "media-desk-sketch-missing-alt",
    }),
    session("session-settings-saved", "settings", "restored", {
      settingsSectionId: "site-identity",
    }),
    session("session-settings-dirty", "settings", "restored", {
      settingsSectionId: "navigation",
    }),
    session("session-settings-invalid", "settings", "restored", {
      settingsSectionId: "domain",
    }),
    session("session-preview-ready", "article-editor", "restored", {
      articleId: "article-writing-desk",
      previewId: "preview-ready",
    }),
    session("session-preview-stale", "article-editor", "restored", {
      articleId: "article-small-shop",
      previewId: "preview-stale",
    }),
    session("session-preview-loading", "article-editor", "restored", {
      articleId: "article-writing-desk",
      previewId: "preview-loading",
    }),
    session("session-preview-blocked", "article-editor", "restored", {
      articleId: "article-writing-desk-invalid",
      previewId: "preview-blocked",
    }),
    session("session-preview-failed", "article-editor", "restored", {
      articleId: "article-writing-desk",
      previewId: "preview-failed",
    }),
    session("session-publish-preview", "publish-preview", "restored", {
      publishId: "publish-preview",
    }),
    session("session-publish-confirm", "publish-preview", "restored", {
      publishId: "publish-confirm",
    }),
    session("session-publish-progress", "publish-preview", "restored", {
      publishId: "publish-progress",
    }),
    session("session-publish-success", "publish-preview", "restored", {
      publishId: "publish-success",
    }),
    session("session-publish-blocked", "publish-preview", "restored", {
      publishId: "publish-blocked",
    }),
    session("session-publish-failed", "publish-preview", "restored", {
      publishId: "publish-failed",
    }),
    session("session-restore-checkpoints", "restore", "restored", {
      articleId: "article-writing-desk",
      restoreId: "restore-ready",
    }),
    session("session-restore-confirm", "restore", "restored", {
      articleId: "article-writing-desk",
      restoreId: "restore-confirm",
    }),
    session("session-restore-restored", "restore", "restored", {
      articleId: "article-writing-desk",
      restoreId: "restore-restored",
    }),
    session("session-restore-unavailable", "restore", "restored", {
      articleId: "article-writing-desk",
      restoreId: "restore-unavailable",
    }),
  ],
  settings: [
    {
      activeSectionId: "site-identity",
      diagnostics: [],
      id: "settings-saved",
      sections: settingsSections("saved"),
      state: "saved",
    },
    {
      activeSectionId: "navigation",
      diagnostics: [],
      id: "settings-dirty",
      sections: settingsSections("dirty"),
      state: "dirty",
    },
    {
      activeSectionId: "domain",
      diagnostics: [diagnostics[5]],
      id: "settings-invalid",
      sections: settingsSections("invalid"),
      state: "invalid",
    },
  ],
  workspace: {
    displayName: "Northwind Journal",
    id: "workspace-northwind-journal",
    providers: {
      build: {
        capabilities: ["build.preview", "build.static-site"],
        family: "build",
        id: "astro-build",
        label: "Astro build",
        status: "available",
      },
      deploy: deployProvider,
      diagnostics: {
        capabilities: ["site.check", "diagnostics.explain"],
        family: "diagnostics",
        id: "studio-diagnostics",
        label: "Studio diagnostics",
        status: "available",
      },
      history: historyProvider,
      identity: {
        capabilities: ["identity.local-user"],
        family: "identity",
        id: "local-identity",
        label: "Local user",
        status: "available",
      },
      media: mediaProvider,
      observability: {
        capabilities: ["audit.local-events"],
        family: "observability",
        id: "local-audit",
        label: "Local audit log",
        status: "available",
      },
      source: sourceProvider,
      workflow: {
        capabilities: ["workflow.draft", "workflow.publish"],
        family: "workflow",
        id: "single-author-workflow",
        label: "Simple publishing workflow",
        status: "available",
      },
    },
    publicUrl: "https://northwindjournal.com",
    recentProjects: [
      {
        displayName: "Northwind Journal",
        id: "recent-northwind",
        lastOpenedLabel: "Today, 9:41 AM",
        rootDisplayPath: "~/Studio Sites/northwind-journal",
        status: "available",
      },
      {
        displayName: "Cedar Notes",
        id: "recent-cedar",
        lastOpenedLabel: "May 12, 2026",
        rootDisplayPath: "~/Studio Sites/cedar-notes",
        status: "missing",
      },
      {
        displayName: "Field Guide",
        id: "recent-field-guide",
        lastOpenedLabel: "May 10, 2026",
        rootDisplayPath: "~/Studio Sites/field-guide",
        status: "available",
      },
    ],
    rootDisplayPath: "~/Studio Sites/northwind-journal",
    status: "ready",
  },
} as const satisfies StudioMvpFixture;

function field(input: {
  readonly diagnosticCode?: string;
  readonly draftValue?: FieldDescriptorFixture["draftValue"];
  readonly effects: FieldDescriptorFixture["generatedEffects"];
  readonly helpText?: string;
  readonly id: string;
  readonly input: FieldDescriptorFixture["input"];
  readonly label: string;
  readonly path: string;
  readonly required: boolean;
  readonly status?: FieldDescriptorFixture["validation"]["status"];
  readonly value: FieldDescriptorFixture["value"];
}): FieldDescriptorFixture {
  return {
    generatedEffects: input.effects,
    ...(input.helpText === undefined ? {} : { helpText: input.helpText }),
    id: input.id,
    input: input.input,
    label: input.label,
    required: input.required,
    sourcePath: input.path,
    validation: {
      ...(input.diagnosticCode === undefined
        ? {}
        : { diagnosticCode: input.diagnosticCode }),
      status: input.status ?? "valid",
    },
    value: input.value,
    visibility: "beginner",
    ...(input.draftValue === undefined ? {} : { draftValue: input.draftValue }),
  };
}

function directoryResult(
  articleId: string,
  status: "dirty" | "draft" | "invalid" | "missing-media" | "published",
  featuredMediaId: string,
) {
  return {
    articleId,
    author: "Ava Brooks",
    category: "Workshop",
    dateLabel: "May 14, 2026",
    excerpt:
      articleId === "article-writing-desk"
        ? "A simple, sturdy writing desk can transform the way you work and think."
        : "Practical notes for making a small woodworking space easier to use.",
    featuredMediaId,
    readTimeLabel: "7 min read",
    status,
    tags: ["woodworking", "home", "tools"],
    title: articleTitleForDirectoryResult(articleId),
    ...(status === "missing-media"
      ? { diagnosticCode: "STUDIO-MEDIA-MISSING-SOURCE" }
      : {}),
  };
}

function articleTitleForDirectoryResult(articleId: string): string {
  switch (articleId) {
    case "article-small-shop":
      return "Small Shop Organization Ideas";
    case "article-writing-desk":
      return "How to Build a Writing Desk";
    default:
      return "Choosing the Right Wood";
  }
}

function navItem(
  id: string,
  label: string,
  screen: "article-directory" | "media" | "settings",
  commandId: string,
) {
  return { commandId, id, label, screen };
}

function publishPlan() {
  return {
    checkpointRequired: true,
    destinationUrl: "https://northwindjournal.com",
    id: "publish-plan-cloudflare-production",
    operationFamily: "publish.plan",
    summary: [
      "Build the static site preview.",
      "Save a checkpoint before publishing.",
      "Deploy the latest generated output to Cloudflare.",
    ],
  } as const;
}

function screen(
  id: StudioMvpFixture["screenStates"][number]["id"],
  screenName: StudioMvpFixture["screenStates"][number]["screen"],
  label: string,
  sessionId: string,
  operationFamilies: StudioMvpFixture["screenStates"][number]["operationFamilies"],
) {
  return { id, label, operationFamilies, screen: screenName, sessionId };
}

function session(
  id: string,
  screen: StudioMvpFixture["sessions"][number]["activeScreen"],
  restoreStatus: StudioMvpFixture["sessions"][number]["restoreStatus"],
  active?: {
    readonly articleId?: string;
    readonly directoryId?: string;
    readonly mediaId?: string;
    readonly previewId?: string;
    readonly publishId?: string;
    readonly restoreId?: string;
    readonly settingsSectionId?: string;
  },
): StudioMvpFixture["sessions"][number] {
  const previewPane =
    screen === "article-editor"
      ? { sizePx: 520, visibility: "expanded" as const }
      : { sizePx: 0, visibility: "collapsed" as const };

  return {
    activeScreen: screen,
    id,
    lastRestoredAt: "2026-05-29T13:41:00.000Z",
    previewPane,
    restoreStatus,
    sidebar: { sizePx: 280, visibility: "expanded" as const },
    ...(active?.articleId === undefined
      ? {}
      : { activeArticleId: active.articleId }),
    ...(active?.directoryId === undefined
      ? {}
      : { activeDirectoryScenarioId: active.directoryId }),
    ...(active?.mediaId === undefined ? {} : { activeMediaId: active.mediaId }),
    ...(screen === "first-launch" || restoreStatus === "project-missing"
      ? {}
      : { activeProjectId: "workspace-northwind-journal" }),
    ...(active?.previewId === undefined
      ? {}
      : { activePreviewScenarioId: active.previewId }),
    ...(active?.publishId === undefined
      ? {}
      : { activePublishScenarioId: active.publishId }),
    ...(active?.restoreId === undefined
      ? {}
      : { activeRestoreScenarioId: active.restoreId }),
    ...(active?.settingsSectionId === undefined
      ? {}
      : { activeSettingsSectionId: active.settingsSectionId }),
    ...(screen === "article-editor"
      ? {
          editor: {
            contextTarget: "cursor",
            cursorOffset: 84,
            lastCommandId: "editor.open",
            scrollTop: 0,
          },
        }
      : {}),
  };
}

function settingsSections(
  state: "dirty" | "invalid" | "saved",
): readonly FieldSectionFixture[] {
  return [
    {
      fields: [
        field({
          effects: ["metadata", "search", "social-preview"],
          helpText:
            "This name appears in the app, browser titles, feeds, and social previews.",
          id: "siteName",
          input: "text",
          label: "Site name",
          path: "site.name",
          required: true,
          value: "Northwind Journal",
        }),
        field({
          effects: ["metadata", "search", "social-preview"],
          helpText:
            "Keep this short enough to fit in search results and previews.",
          id: "tagline",
          input: "text",
          label: "Tagline",
          path: "site.tagline",
          required: false,
          value: "Thoughtful guides for a well-crafted life",
        }),
      ],
      id: "site-identity",
      label: "Site identity",
    },
    {
      fields: [
        field({
          effects: ["metadata", "route", "sitemap", "social-preview"],
          helpText:
            "Use the public address readers should see in search results and links.",
          id: "siteUrl",
          input: "url",
          label: "Site URL",
          path: "site.url",
          required: true,
          status: state === "invalid" ? "invalid" : "valid",
          value: "https://northwindjournal.com",
          ...(state === "invalid"
            ? {
                diagnosticCode: "STUDIO-SETTINGS-SITE-URL-INVALID",
                draftValue: "northwindjournal",
              }
            : {}),
        }),
      ],
      id: "domain",
      label: "Domain",
    },
    {
      fields: [
        field({
          effects: ["homepage", "route"],
          helpText: "Show the main article index in the site navigation.",
          id: "articlesInNav",
          input: "toggle",
          label: "Show Articles in navigation",
          path: "navigation.articles.enabled",
          required: false,
          value: true,
          ...(state === "dirty" ? { draftValue: false } : {}),
        }),
      ],
      id: "navigation",
      label: "Navigation",
    },
    {
      fields: [
        field({
          effects: ["metadata"],
          helpText: "Shown wherever readers can support the publication.",
          id: "supportUrl",
          input: "url",
          label: "Support link",
          path: "support.url",
          required: false,
          value: "https://patreon.com/northwindjournal",
        }),
        field({
          effects: ["metadata", "social-preview"],
          helpText: "Used when readers share or attribute the site.",
          id: "socialHandle",
          input: "text",
          label: "Social handle",
          path: "social.primaryHandle",
          required: false,
          value: "@northwindjournal",
        }),
      ],
      id: "social-support",
      label: "Social and support",
    },
    {
      fields: [
        field({
          effects: ["feed", "metadata"],
          helpText:
            "New articles use this author unless another author is chosen.",
          id: "defaultAuthor",
          input: "select",
          label: "Default author",
          path: "authors.default",
          required: true,
          value: "Ava Brooks",
        }),
        field({
          effects: ["metadata", "search"],
          helpText: "Show author bios on article pages where available.",
          id: "showAuthorBio",
          input: "toggle",
          label: "Show author bios",
          path: "authors.showBio",
          required: false,
          value: true,
        }),
      ],
      id: "authors",
      label: "Authors",
    },
    {
      fields: [
        field({
          effects: ["homepage", "metadata", "route", "search"],
          helpText: "Used when creating a new article from the simple editor.",
          id: "defaultCategory",
          input: "select",
          label: "Default category",
          path: "taxonomy.defaultCategory",
          required: true,
          value: "Workshop",
        }),
        field({
          effects: ["search"],
          helpText: "Let readers browse articles by tag.",
          id: "showTags",
          input: "toggle",
          label: "Show tags",
          path: "taxonomy.showTags",
          required: false,
          value: true,
        }),
      ],
      id: "categories",
      label: "Categories and tags",
    },
    {
      fields: [
        field({
          effects: ["homepage"],
          helpText: "Short copy shown near the top of the home page.",
          id: "homepageIntro",
          input: "textarea",
          label: "Home page intro",
          path: "homepage.intro",
          required: false,
          value:
            "Practical guides, notes, and inspiration for careful woodworking.",
        }),
        field({
          effects: ["homepage", "search"],
          helpText: "Choose which collection is highlighted first.",
          id: "featuredCollection",
          input: "select",
          label: "Featured collection",
          path: "homepage.featuredCollection",
          required: false,
          value: "Workshop essentials",
        }),
      ],
      id: "homepage",
      label: "Homepage",
    },
    {
      fields: [
        field({
          effects: ["homepage", "metadata"],
          helpText:
            "A simple theme choice for links, buttons, and selected states.",
          id: "accentColor",
          input: "select",
          label: "Accent color",
          path: "theme.accentColor",
          required: true,
          value: "Blue",
        }),
        field({
          effects: ["homepage"],
          helpText: "Use the built-in readable type system.",
          id: "typography",
          input: "select",
          label: "Typography",
          path: "theme.typography",
          required: true,
          value: "System",
        }),
      ],
      id: "theme",
      label: "Theme basics",
    },
    {
      fields: [
        field({
          effects: ["metadata", "route"],
          helpText: "The current MVP fixture deploys to Cloudflare Workers.",
          id: "publishTarget",
          input: "select",
          label: "Publish target",
          path: "publishing.target",
          required: true,
          value: "Cloudflare Workers",
        }),
        field({
          effects: ["sitemap"],
          helpText: "Check the site before the final publish confirmation.",
          id: "previewBeforePublish",
          input: "toggle",
          label: "Preview before publishing",
          path: "publishing.previewBeforePublish",
          required: false,
          value: true,
        }),
      ],
      id: "publishing",
      label: "Publishing",
    },
  ];
}
