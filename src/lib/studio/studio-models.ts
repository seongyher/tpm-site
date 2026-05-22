import type {
  AuthorDiagnostic,
  AuthorDiagnosticCategory,
  AuthorDiagnosticRepairOwner,
} from "../diagnostics/author-diagnostics";
import {
  siteFeatureKeys,
  siteRouteKeys,
  siteShareTargetIds,
} from "../site/site-config-defaults";
import type {
  SourceArtifactKey,
  SourceArtifactOwner,
  SourceArtifactRole,
} from "../site/source-artifacts";

/** Editable source domains exposed to future studio, CLI, and MCP surfaces. */
export const studioEditableDomains = [
  "article",
  "announcement",
  "page",
  "collection",
  "author",
  "category",
  "redirect",
  "site-config",
  "support-link",
  "social-link",
  "feature-flag",
  "theme-token",
  "media-asset",
] as const;

/** Stable editable source domain ID. */
export type StudioEditableDomain = (typeof studioEditableDomains)[number];

/** Schema or contract family that owns validation for an editable source. */
type StudioSchemaOwner =
  | "announcement-schema"
  | "article-schema"
  | "author-schema"
  | "category-schema"
  | "collection-schema"
  | "media-policy"
  | "page-schema"
  | "redirect-schema"
  | "site-config-schema"
  | "theme-policy";

/** UI-editability class for a studio field or component-backed source. */
export type StudioEditability =
  | "advanced"
  | "beginner"
  | "code-only"
  | "extension-owned";

/** Form input primitive expected by future generated forms. */
type StudioFieldInputKind =
  | "boolean"
  | "date"
  | "image"
  | "multi-select"
  | "number"
  | "path"
  | "reference"
  | "select"
  | "text"
  | "textarea"
  | "token"
  | "url";

/** Generated or public surfaces affected by a studio edit. */
export type StudioGeneratedSurface =
  | "css"
  | "feed"
  | "homepage"
  | "metadata"
  | "navigation"
  | "pdf"
  | "redirects"
  | "route"
  | "search"
  | "sitemap"
  | "social-preview";

/** Stable source reference for one editable source family. */
export interface StudioSourceReference {
  readonly artifactKey: SourceArtifactKey;
  readonly defaultOwner: SourceArtifactOwner;
  readonly description: string;
  readonly domain: StudioEditableDomain;
  readonly role: SourceArtifactRole;
  readonly schemaOwner: StudioSchemaOwner;
}

/** One studio-editable field or field family. */
export interface StudioFieldDescriptor {
  readonly diagnostics: readonly AuthorDiagnosticCategory[];
  readonly editability: StudioEditability;
  readonly effects: readonly StudioGeneratedSurface[];
  readonly fieldPath: string;
  readonly id: string;
  readonly input: StudioFieldInputKind;
  readonly label: string;
  readonly owner: AuthorDiagnosticRepairOwner;
  readonly required: boolean;
  readonly source: StudioSourceReference;
}

/** JSON-ready normalized editor document descriptor. */
export interface StudioEditorDocument {
  readonly description: string;
  readonly fields: readonly StudioFieldDescriptor[];
  readonly id: string;
  readonly source: StudioSourceReference;
  readonly title: string;
}

/** Required review/reference fact for review workflow states. */
interface StudioReviewReference {
  readonly id: string;
  readonly label?: string | undefined;
}

/** Required release/reference fact for published workflow states. */
interface StudioReleaseReference {
  readonly id: string;
  readonly label?: string | undefined;
}

/** Required restore point fact for rollback workflow states. */
interface StudioRestorePointReference {
  readonly id: string;
  readonly label?: string | undefined;
}

/** Normalized studio editorial state. */
export type StudioEditorialState =
  | { readonly kind: "approved"; readonly review: StudioReviewReference }
  | {
      readonly kind: "changes-requested";
      readonly review: StudioReviewReference;
    }
  | { readonly kind: "draft" }
  | { readonly kind: "in-review"; readonly review: StudioReviewReference }
  | { readonly kind: "published"; readonly release: StudioReleaseReference }
  | { readonly kind: "ready" }
  | {
      readonly kind: "rollback-proposed";
      readonly restorePoint: StudioRestorePointReference;
    }
  | { readonly kind: "scheduled"; readonly publishAt: string }
  | { readonly kind: "unpublished"; readonly reason?: string | undefined };

/** Editorial actions understood by the studio workflow model. */
export type StudioWorkflowAction =
  | "approve"
  | "mark-ready"
  | "publish"
  | "request-changes"
  | "restore"
  | "roll-back"
  | "save-draft"
  | "schedule"
  | "submit-review"
  | "unpublish";

/** Additional facts required by some workflow transitions. */
export interface StudioWorkflowTransitionContext {
  readonly blockingDiagnostics?: readonly AuthorDiagnostic[] | undefined;
  readonly publishAt?: string | undefined;
  readonly release?: StudioReleaseReference | undefined;
  readonly restorePoint?: StudioRestorePointReference | undefined;
  readonly review?: StudioReviewReference | undefined;
  readonly unpublishReason?: string | undefined;
}

/** Result of attempting to apply a studio workflow transition. */
export type StudioWorkflowTransitionResult =
  | {
      readonly diagnostics: readonly string[];
      readonly ok: false;
      readonly state: StudioEditorialState;
    }
  | {
      readonly diagnostics: readonly string[];
      readonly ok: true;
      readonly state: StudioEditorialState;
    };

interface StudioSourceDefinitionInput {
  readonly artifactKey: SourceArtifactKey;
  readonly defaultOwner: SourceArtifactOwner;
  readonly description: string;
  readonly domain: StudioEditableDomain;
  readonly role: SourceArtifactRole;
  readonly schemaOwner: StudioSchemaOwner;
}

interface StudioFieldDefinitionInput {
  readonly diagnostics: readonly AuthorDiagnosticCategory[];
  readonly editability?: StudioEditability | undefined;
  readonly effects: readonly StudioGeneratedSurface[];
  readonly fieldPath: string;
  readonly id: string;
  readonly input: StudioFieldInputKind;
  readonly label: string;
  readonly owner: AuthorDiagnosticRepairOwner;
  readonly required?: boolean | undefined;
}

const sourceDefinitions = [
  {
    artifactKey: "content.articles",
    defaultOwner: "author",
    description: "Article Markdown or MDX source",
    domain: "article",
    role: "content",
    schemaOwner: "article-schema",
  },
  {
    artifactKey: "content.announcements",
    defaultOwner: "author",
    description: "Announcement Markdown or MDX source",
    domain: "announcement",
    role: "content",
    schemaOwner: "announcement-schema",
  },
  {
    artifactKey: "content.pages",
    defaultOwner: "author",
    description: "Standalone Markdown page source",
    domain: "page",
    role: "content",
    schemaOwner: "page-schema",
  },
  {
    artifactKey: "content.collections",
    defaultOwner: "author",
    description: "Editorial collection source",
    domain: "collection",
    role: "content",
    schemaOwner: "collection-schema",
  },
  {
    artifactKey: "content.authors",
    defaultOwner: "author",
    description: "Author profile source",
    domain: "author",
    role: "content",
    schemaOwner: "author-schema",
  },
  {
    artifactKey: "content.categories",
    defaultOwner: "site-owner",
    description: "Category display metadata source",
    domain: "category",
    role: "content",
    schemaOwner: "category-schema",
  },
  {
    artifactKey: "config.redirects",
    defaultOwner: "site-owner",
    description: "Site redirect map",
    domain: "redirect",
    role: "config",
    schemaOwner: "redirect-schema",
  },
  {
    artifactKey: "config.site",
    defaultOwner: "site-owner",
    description: "Site-wide publication configuration",
    domain: "site-config",
    role: "config",
    schemaOwner: "site-config-schema",
  },
  {
    artifactKey: "config.site",
    defaultOwner: "site-owner",
    description: "Support call-to-action links",
    domain: "support-link",
    role: "config",
    schemaOwner: "site-config-schema",
  },
  {
    artifactKey: "config.site",
    defaultOwner: "site-owner",
    description: "Social and share link configuration",
    domain: "social-link",
    role: "config",
    schemaOwner: "site-config-schema",
  },
  {
    artifactKey: "config.site",
    defaultOwner: "site-owner",
    description: "Optional feature flags",
    domain: "feature-flag",
    role: "config",
    schemaOwner: "site-config-schema",
  },
  {
    artifactKey: "theme",
    defaultOwner: "site-owner",
    description: "Site theme token overrides",
    domain: "theme-token",
    role: "theme",
    schemaOwner: "theme-policy",
  },
  {
    artifactKey: "assets.root",
    defaultOwner: "site-owner",
    description: "Media source assets and public static files",
    domain: "media-asset",
    role: "asset-source",
    schemaOwner: "media-policy",
  },
] as const satisfies readonly StudioSourceDefinitionInput[];

const fieldDefinitions = {
  announcement: publishableFieldDefinitions("announcement", false),
  article: publishableFieldDefinitions("article", true),
  author: [
    field("displayName", "Display name", "text", ["metadata"], ["content"], {
      required: true,
    }),
    field("aliases", "Aliases", "multi-select", ["search"], ["content"]),
    field("type", "Author type", "select", ["metadata"], ["content"], {
      required: true,
    }),
    field("shortBio", "Short bio", "textarea", ["metadata"], ["content"]),
    field("website", "Website", "url", ["metadata"], ["metadata"]),
    field("socials", "Social links", "reference", ["metadata"], ["metadata"]),
  ],
  category: [
    field(
      "title",
      "Category title",
      "text",
      ["navigation", "route", "search", "sitemap"],
      ["content", "routes"],
      { required: true },
    ),
    field(
      "description",
      "Description",
      "textarea",
      ["metadata", "search"],
      ["metadata"],
    ),
    field("order", "Sort order", "number", ["navigation"], ["content"], {
      required: true,
    }),
  ],
  collection: [
    field(
      "title",
      "Collection title",
      "text",
      ["homepage", "metadata", "route", "search", "sitemap"],
      ["content", "routes"],
      { required: true },
    ),
    field(
      "description",
      "Description",
      "textarea",
      ["metadata", "search"],
      ["metadata"],
    ),
    field("draft", "Draft", "boolean", ["route", "sitemap"], ["content"]),
    field(
      "items",
      "Ordered entries",
      "reference",
      ["homepage", "route"],
      ["content", "routes"],
    ),
  ],
  "feature-flag": siteFeatureKeys.map((featureKey) =>
    field(
      `features.${featureKey}`,
      featureLabel(featureKey),
      "boolean",
      featureEffects(featureKey),
      ["config", "routes"],
      {
        owner: "site-owner",
      },
    ),
  ),
  "media-asset": [
    field(
      "source",
      "Asset source",
      "path",
      ["metadata", "pdf", "search", "social-preview"],
      ["assets", "media"],
      { owner: "site-owner", required: true },
    ),
    field(
      "alt",
      "Alt text",
      "text",
      ["metadata", "pdf", "search", "social-preview"],
      ["accessibility", "media"],
      { required: true },
    ),
    field(
      "role",
      "Media role",
      "select",
      ["metadata", "pdf", "social-preview"],
      ["media"],
      { owner: "site-owner" },
    ),
  ],
  page: [
    field(
      "body",
      "Page body",
      "textarea",
      ["metadata", "route", "search", "sitemap"],
      ["content"],
    ),
    field(
      "title",
      "Page title",
      "text",
      ["metadata", "route", "search", "sitemap"],
      ["content", "routes"],
      { required: true },
    ),
    field(
      "description",
      "Description",
      "textarea",
      ["metadata", "search"],
      ["metadata"],
    ),
    field("draft", "Draft", "boolean", ["route", "sitemap"], ["content"]),
    field("hero.lightImage", "Hero image", "image", ["metadata"], ["media"]),
    field(
      "hero.darkImage",
      "Dark-mode hero image",
      "image",
      ["metadata"],
      ["media"],
      { editability: "advanced" },
    ),
    field(
      "hero.imageAlt",
      "Hero image alt text",
      "text",
      ["metadata"],
      ["accessibility", "media"],
    ),
    field("hero.tagline", "Hero tagline", "text", ["metadata"], ["content"]),
    field(
      "startHere",
      "Start here links",
      "reference",
      ["homepage"],
      ["content", "routes"],
    ),
  ],
  redirect: [
    field("from", "Source path", "path", ["redirects"], ["redirects"], {
      owner: "site-owner",
      required: true,
    }),
    field("to", "Target path or URL", "path", ["redirects"], ["redirects"], {
      owner: "site-owner",
      required: true,
    }),
  ],
  "site-config": [
    field("identity.title", "Site title", "text", ["metadata"], ["config"], {
      owner: "site-owner",
      required: true,
    }),
    field(
      "identity.description",
      "Site description",
      "textarea",
      ["metadata"],
      ["config", "metadata"],
      { owner: "site-owner", required: true },
    ),
    field("identity.url", "Canonical URL", "url", ["metadata"], ["config"], {
      owner: "site-owner",
      required: true,
    }),
    field(
      "identity.logo",
      "Publication logo",
      "path",
      ["metadata", "social-preview"],
      ["assets", "metadata"],
      { editability: "advanced", owner: "site-owner" },
    ),
    field(
      "routes",
      "Route paths",
      "reference",
      ["navigation", "route"],
      ["config", "routes"],
      {
        editability: "advanced",
        owner: "site-owner",
        required: true,
      },
    ),
    field(
      "navigation",
      "Navigation links",
      "reference",
      ["navigation"],
      ["config", "routes"],
      {
        owner: "site-owner",
      },
    ),
    field(
      "homepage",
      "Homepage sections",
      "reference",
      ["homepage"],
      ["config", "content"],
      {
        owner: "site-owner",
      },
    ),
    field(
      "contentDefaults",
      "Content defaults",
      "reference",
      ["feed", "pdf", "search", "sitemap"],
      ["config", "frontmatter"],
      { editability: "advanced", owner: "site-owner" },
    ),
    ...siteRouteKeys.map((routeKey) =>
      field(
        `routes.${routeKey}`,
        `Route: ${routeKey}`,
        "path",
        ["metadata", "navigation", "route", "search", "sitemap"],
        ["config", "routes"],
        {
          editability: "advanced",
          owner: "site-owner",
          required: true,
        },
      ),
    ),
  ],
  "social-link": [
    field(
      "identity.sameAs",
      "Social profiles",
      "multi-select",
      ["metadata"],
      ["metadata"],
      {
        owner: "site-owner",
      },
    ),
    field(
      "share.targets",
      "Share targets",
      "multi-select",
      ["metadata"],
      ["config", "metadata"],
      {
        owner: "site-owner",
      },
    ),
    ...siteShareTargetIds.map((targetId) =>
      field(
        `share.targets.${targetId}`,
        `Share target: ${targetId}`,
        "boolean",
        ["metadata"],
        ["config", "metadata"],
        {
          owner: "site-owner",
        },
      ),
    ),
  ],
  "support-link": [
    field(
      "support.block.title",
      "Support block title",
      "text",
      ["route"],
      ["config"],
      {
        owner: "site-owner",
        required: true,
      },
    ),
    field(
      "support.block.body",
      "Support block body",
      "textarea",
      ["route"],
      ["config"],
      {
        owner: "site-owner",
        required: true,
      },
    ),
    field("support.patreon.href", "Patreon URL", "url", ["route"], ["config"], {
      owner: "site-owner",
      required: true,
    }),
    field("support.discord.href", "Discord URL", "url", ["route"], ["config"], {
      owner: "site-owner",
      required: true,
    }),
  ],
  "theme-token": [
    field("--color-*", "Color tokens", "token", ["css"], ["config"], {
      editability: "advanced",
      owner: "site-owner",
    }),
    field("--radius-*", "Radius tokens", "token", ["css"], ["config"], {
      editability: "advanced",
      owner: "site-owner",
    }),
    field("--font-*", "Typography tokens", "token", ["css"], ["config"], {
      editability: "advanced",
      owner: "site-owner",
    }),
  ],
} as const satisfies Record<
  StudioEditableDomain,
  readonly StudioFieldDefinitionInput[]
>;

/**
 * Returns all studio source references.
 *
 * @returns Source references derived from current platform source contracts.
 */
export function studioSourceReferences(): StudioSourceReference[] {
  return sourceDefinitions.map((definition) => ({ ...definition }));
}

/**
 * Returns one studio source reference by editable domain.
 *
 * @param domain Editable domain to resolve.
 * @returns Matching source reference.
 */
export function studioSourceReference(
  domain: StudioEditableDomain,
): StudioSourceReference {
  const reference = studioSourceReferences().find(
    (candidate) => candidate.domain === domain,
  );

  if (reference === undefined) {
    throw new Error(`Missing studio source reference for "${domain}".`);
  }

  return reference;
}

/**
 * Builds field descriptors for one editable domain.
 *
 * @param domain Editable domain to describe.
 * @returns JSON-ready field descriptors.
 */
export function studioFieldDescriptors(
  domain: StudioEditableDomain,
): StudioFieldDescriptor[] {
  const source = studioSourceReference(domain);

  return studioFieldDefinitionsForDomain(domain).map((definition) => ({
    ...definition,
    editability: definition.editability ?? "beginner",
    owner: definition.owner,
    required: definition.required ?? false,
    source,
  }));
}

/**
 * Builds editor document descriptors for every editable source domain.
 *
 * @returns Deterministic studio editor document descriptors.
 */
export function studioEditorDocuments(): StudioEditorDocument[] {
  return studioSourceReferences().map((source) => ({
    description: source.description,
    fields: studioFieldDescriptors(source.domain),
    id: source.domain,
    source,
    title: studioDomainTitle(source.domain),
  }));
}

/**
 * Returns repairable studio fields likely related to an author diagnostic.
 *
 * @param diagnostic Author-facing diagnostic.
 * @param documents Optional studio documents to search.
 * @returns Field descriptors that share source, field path, or category.
 */
export function studioFieldsForDiagnostic(
  diagnostic: AuthorDiagnostic,
  documents: readonly StudioEditorDocument[] = studioEditorDocuments(),
): StudioFieldDescriptor[] {
  const fieldPath = diagnostic.location?.fieldPath;
  const sourcePath = diagnostic.location?.sourcePath;

  return documents
    .flatMap((document) => document.fields)
    .filter((fieldDescriptor) => {
      if (fieldPath !== undefined && fieldDescriptor.fieldPath === fieldPath) {
        return true;
      }

      if (
        sourcePath?.includes(sourceArtifactPathHint(fieldDescriptor.source)) ===
        true
      ) {
        return true;
      }

      return fieldDescriptor.diagnostics.includes(diagnostic.category);
    });
}

/**
 * Applies a typed workflow action to a current editorial state.
 *
 * @param state Current editorial state.
 * @param action Requested workflow action.
 * @param context Extra facts required by some transitions.
 * @returns Success or rejection with diagnostics.
 */
export function transitionStudioEditorialState(
  state: StudioEditorialState,
  action: StudioWorkflowAction,
  context: StudioWorkflowTransitionContext = {},
): StudioWorkflowTransitionResult {
  const blockingDiagnostics = context.blockingDiagnostics ?? [];

  if (requiresCleanDiagnostics(action) && blockingDiagnostics.length > 0) {
    return rejected(state, "Resolve blocking diagnostics before continuing.");
  }

  switch (action) {
    case "approve":
      return transitionApprove(state);
    case "mark-ready":
      return transitionMarkReady(state);
    case "publish":
      return transitionPublish(state, context);
    case "request-changes":
      return transitionRequestChanges(state);
    case "restore":
      return transitionRestore(state);
    case "roll-back":
      return transitionRollBack(state, context);
    case "save-draft":
      return accepted({ kind: "draft" });
    case "schedule":
      return transitionSchedule(state, context);
    case "submit-review":
      return transitionSubmitReview(state, context);
    case "unpublish":
      return transitionUnpublish(state, context);
  }
}

function accepted(state: StudioEditorialState): StudioWorkflowTransitionResult {
  return { diagnostics: [], ok: true, state };
}

function field(
  fieldPath: string,
  label: string,
  input: StudioFieldInputKind,
  effects: readonly StudioGeneratedSurface[],
  diagnostics: readonly AuthorDiagnosticCategory[],
  options: {
    readonly editability?: StudioEditability | undefined;
    readonly owner?: AuthorDiagnosticRepairOwner | undefined;
    readonly required?: boolean | undefined;
  } = {},
): StudioFieldDefinitionInput {
  return {
    diagnostics,
    editability: options.editability,
    effects,
    fieldPath,
    id: fieldPath,
    input,
    label,
    owner: options.owner ?? "author",
    required: options.required,
  };
}

function featureEffects(
  featureKey: (typeof siteFeatureKeys)[number],
): readonly StudioGeneratedSurface[] {
  switch (featureKey) {
    case "announcements":
    case "authors":
    case "bibliography":
    case "categories":
    case "collections":
    case "tags":
      return ["metadata", "navigation", "route", "search", "sitemap"];
    case "feed":
      return ["feed", "metadata"];
    case "pdf":
      return ["pdf", "route"];
    case "search":
      return ["route", "search"];
    case "support":
      return ["route"];
    case "themeToggle":
      return ["css", "route"];
  }
}

function studioFieldDefinitionsForDomain(
  domain: StudioEditableDomain,
): readonly StudioFieldDefinitionInput[] {
  switch (domain) {
    case "announcement":
      return fieldDefinitions.announcement;
    case "article":
      return fieldDefinitions.article;
    case "author":
      return fieldDefinitions.author;
    case "category":
      return fieldDefinitions.category;
    case "collection":
      return fieldDefinitions.collection;
    case "feature-flag":
      return fieldDefinitions["feature-flag"];
    case "media-asset":
      return fieldDefinitions["media-asset"];
    case "page":
      return fieldDefinitions.page;
    case "redirect":
      return fieldDefinitions.redirect;
    case "site-config":
      return fieldDefinitions["site-config"];
    case "social-link":
      return fieldDefinitions["social-link"];
    case "support-link":
      return fieldDefinitions["support-link"];
    case "theme-token":
      return fieldDefinitions["theme-token"];
  }
}

function featureLabel(featureKey: (typeof siteFeatureKeys)[number]): string {
  return `Feature: ${featureKey}`;
}

function publishableFieldDefinitions(
  domain: "announcement" | "article",
  includeArticleFields: boolean,
): readonly StudioFieldDefinitionInput[] {
  const base = [
    field(
      "body",
      domain === "article" ? "Article body" : "Announcement body",
      "textarea",
      ["feed", "metadata", "route", "search", "sitemap"],
      ["content"],
    ),
    field(
      "title",
      "Title",
      "text",
      ["metadata", "route", "search", "sitemap"],
      ["content", "metadata"],
      { required: true },
    ),
    field(
      "description",
      "Description",
      "textarea",
      ["feed", "metadata", "search", "social-preview"],
      ["content", "metadata"],
      { required: true },
    ),
    field(
      "author",
      "Author",
      "reference",
      ["metadata", "search"],
      ["content", "metadata"],
      {
        required: true,
      },
    ),
    field(
      "date",
      "Publish date",
      "date",
      ["feed", "metadata", "sitemap"],
      ["content", "metadata"],
      {
        required: true,
      },
    ),
    field(
      "updated",
      "Updated date",
      "date",
      ["metadata", "sitemap"],
      ["metadata"],
    ),
    field(
      "draft",
      "Draft",
      "boolean",
      ["feed", "route", "search", "sitemap"],
      ["content"],
    ),
    field(
      "visibility",
      "Visibility",
      "reference",
      ["feed", "homepage", "pdf", "route", "search", "sitemap"],
      ["content", "routes"],
    ),
    field(
      "image",
      "Preview image",
      "image",
      ["feed", "metadata", "pdf", "search", "social-preview"],
      ["media", "metadata"],
    ),
    field(
      "imageAlt",
      "Preview image alt text",
      "text",
      ["feed", "metadata", "pdf", "search", "social-preview"],
      ["accessibility", "media"],
    ),
    field(
      "semantic",
      "Semantic metadata",
      "reference",
      ["metadata"],
      ["metadata"],
      {
        editability: "advanced",
      },
    ),
    field(
      "legacyPermalink",
      "Legacy permalink",
      "path",
      ["redirects"],
      ["redirects"],
      {
        editability: "advanced",
      },
    ),
  ] as const;

  if (domain === "announcement" || !includeArticleFields) {
    return base;
  }

  return [
    ...base,
    field("tags", "Tags", "multi-select", ["metadata", "search"], ["content"]),
    field("pdf", "Generate PDF", "boolean", ["pdf", "route"], ["pdfs"], {
      editability: "advanced",
    }),
  ];
}

function rejected(
  state: StudioEditorialState,
  message: string,
): StudioWorkflowTransitionResult {
  return {
    diagnostics: [message],
    ok: false,
    state,
  };
}

function requiresCleanDiagnostics(action: StudioWorkflowAction): boolean {
  return action === "approve" || action === "publish" || action === "schedule";
}

function sourceArtifactPathHint(source: StudioSourceReference): string {
  return source.artifactKey.replace(/\./gu, "/");
}

function studioDomainTitle(domain: StudioEditableDomain): string {
  return domain
    .split("-")
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}

function transitionApprove(
  state: StudioEditorialState,
): StudioWorkflowTransitionResult {
  if (state.kind !== "in-review" && state.kind !== "changes-requested") {
    return rejected(state, "Only review states can be approved.");
  }

  return accepted({ kind: "approved", review: state.review });
}

function transitionMarkReady(
  state: StudioEditorialState,
): StudioWorkflowTransitionResult {
  if (state.kind === "published") {
    return rejected(state, "Published entries are already public.");
  }

  return accepted({ kind: "ready" });
}

function transitionPublish(
  state: StudioEditorialState,
  context: StudioWorkflowTransitionContext,
): StudioWorkflowTransitionResult {
  if (
    state.kind !== "approved" &&
    state.kind !== "ready" &&
    state.kind !== "scheduled"
  ) {
    return rejected(
      state,
      "Only ready, approved, or scheduled entries can be published.",
    );
  }

  if (context.release === undefined) {
    return rejected(state, "Publishing requires a release reference.");
  }

  return accepted({ kind: "published", release: context.release });
}

function transitionRequestChanges(
  state: StudioEditorialState,
): StudioWorkflowTransitionResult {
  if (state.kind !== "in-review" && state.kind !== "approved") {
    return rejected(state, "Only review states can request changes.");
  }

  return accepted({ kind: "changes-requested", review: state.review });
}

function transitionRestore(
  state: StudioEditorialState,
): StudioWorkflowTransitionResult {
  if (state.kind !== "rollback-proposed") {
    return rejected(state, "Only rollback proposals can be restored.");
  }

  return accepted({ kind: "ready" });
}

function transitionRollBack(
  state: StudioEditorialState,
  context: StudioWorkflowTransitionContext,
): StudioWorkflowTransitionResult {
  if (context.restorePoint === undefined) {
    return rejected(state, "Rollback requires a restore point.");
  }

  return accepted({
    kind: "rollback-proposed",
    restorePoint: context.restorePoint,
  });
}

function transitionSchedule(
  state: StudioEditorialState,
  context: StudioWorkflowTransitionContext,
): StudioWorkflowTransitionResult {
  if (state.kind !== "approved" && state.kind !== "ready") {
    return rejected(state, "Only ready or approved entries can be scheduled.");
  }

  if (context.publishAt === undefined) {
    return rejected(state, "Scheduling requires a publish time.");
  }

  return accepted({ kind: "scheduled", publishAt: context.publishAt });
}

function transitionSubmitReview(
  state: StudioEditorialState,
  context: StudioWorkflowTransitionContext,
): StudioWorkflowTransitionResult {
  if (state.kind !== "draft" && state.kind !== "ready") {
    return rejected(state, "Only draft or ready entries can enter review.");
  }

  if (context.review === undefined) {
    return rejected(state, "Review submission requires a review reference.");
  }

  return accepted({ kind: "in-review", review: context.review });
}

function transitionUnpublish(
  state: StudioEditorialState,
  context: StudioWorkflowTransitionContext,
): StudioWorkflowTransitionResult {
  if (state.kind !== "published" && state.kind !== "scheduled") {
    return rejected(
      state,
      "Only published or scheduled entries can be unpublished.",
    );
  }

  return accepted({
    kind: "unpublished",
    reason: context.unpublishReason,
  });
}
