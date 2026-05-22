import type { SocialPreviewImage } from "../media/social-images";
import { SITE_TITLE } from "../routes/routes";
import { siteConfig, type SiteShareTargetId } from "./site-config";

const threadsMaxPostLength = 500;
const articleShareTargetConfig = {
  attribution: {
    threadsMention: siteConfig.share.threadsMention,
    xViaHandle: siteConfig.share.xViaHandle,
  },
  endpoints: {
    bluesky: "https://bsky.app/intent/compose",
    facebook: "https://www.facebook.com/sharer/sharer.php",
    hackerNews: "https://news.ycombinator.com/submitlink",
    linkedIn: "https://www.linkedin.com/sharing/share-offsite/",
    pinterest: "https://www.pinterest.com/pin/create/button/",
    reddit: "https://www.reddit.com/submit",
    threads: "https://www.threads.com/intent/post",
    x: "https://twitter.com/intent/tweet",
  },
  siteName: SITE_TITLE,
} as const;

/** External public composer targets supported by the article share menu. */
type ArticleShareExternalTargetId = SiteShareTargetId;

/** Presentation icon token for article share actions. */
type ArticleShareIconId =
  | "at-sign"
  | "copy-link"
  | "email"
  | "facebook"
  | "hacker-news"
  | "linkedin"
  | "message"
  | "pinterest"
  | "reddit"
  | "x";

/** A normalized article share action rendered by the article share menu. */
export type ArticleShareAction =
  | {
      readonly copyText: string;
      readonly icon: "copy-link";
      readonly id: "copy-link";
      readonly kind: "copy";
      readonly label: "Copy link";
    }
  | {
      readonly href: string;
      readonly icon: "email";
      readonly id: "email";
      readonly kind: "email";
      readonly label: "Email";
    }
  | {
      readonly href: string;
      readonly icon: ArticleShareIconId;
      readonly id: ArticleShareExternalTargetId;
      readonly kind: "external";
      readonly label: string;
    };

/** Display-ready share menu data for one article. */
export interface ArticleShareMenuViewModel {
  readonly actions: readonly ArticleShareAction[];
  readonly articleUrl: string;
  readonly copyText: string;
  readonly title: string;
}

interface ArticleShareMenuViewModelInput {
  readonly articleUrl: string;
  readonly description?: string | undefined;
  readonly image?: SocialPreviewImage | undefined;
  readonly targetIds?: readonly SiteShareTargetId[] | undefined;
  readonly title: string;
}

interface ArticleShareTargetContext {
  readonly articleUrl: string;
  readonly description: string;
  readonly image?: SocialPreviewImage | undefined;
  readonly title: string;
}

interface ExternalShareTargetDefinition {
  readonly buildHref: (context: ArticleShareTargetContext) => string;
  readonly icon: ArticleShareIconId;
  readonly label: string;
  readonly requiresImage?: boolean;
}

const externalShareTargetDefinitions = new Map<
  SiteShareTargetId,
  ExternalShareTargetDefinition
>([
  [
    "bluesky",
    {
      buildHref: ({ articleUrl, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.bluesky, {
          text: shareText(title, articleUrl),
        }),
      label: "Bluesky",
      icon: "message",
      requiresImage: false,
    },
  ],
  [
    "facebook",
    {
      buildHref: ({ articleUrl }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.facebook, {
          u: articleUrl,
        }),
      label: "Facebook",
      icon: "facebook",
      requiresImage: false,
    },
  ],
  [
    "hacker-news",
    {
      buildHref: ({ articleUrl, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.hackerNews, {
          t: title,
          u: articleUrl,
        }),
      label: "Hacker News",
      icon: "hacker-news",
      requiresImage: false,
    },
  ],
  [
    "linkedin",
    {
      buildHref: ({ articleUrl }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.linkedIn, {
          url: articleUrl,
        }),
      label: "LinkedIn",
      icon: "linkedin",
      requiresImage: false,
    },
  ],
  [
    "pinterest",
    {
      buildHref: ({ articleUrl, description, image, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.pinterest, {
          description: description.length === 0 ? title : description,
          media: image?.src ?? "",
          url: articleUrl,
        }),
      label: "Pinterest",
      icon: "pinterest",
      requiresImage: true,
    },
  ],
  [
    "reddit",
    {
      buildHref: ({ articleUrl, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.reddit, {
          title,
          url: articleUrl,
        }),
      label: "Reddit",
      icon: "reddit",
      requiresImage: false,
    },
  ],
  [
    "threads",
    {
      buildHref: ({ articleUrl, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.threads, {
          text: threadsShareText(title, articleUrl),
        }),
      label: "Threads",
      icon: "at-sign",
      requiresImage: false,
    },
  ],
  [
    "x",
    {
      buildHref: ({ articleUrl, title }) =>
        urlWithQuery(articleShareTargetConfig.endpoints.x, {
          text: title,
          url: articleUrl,
          via: articleShareTargetConfig.attribution.xViaHandle,
        }),
      label: "X",
      icon: "x",
      requiresImage: false,
    },
  ],
]);

/**
 * Builds the article share menu view model from canonical article metadata.
 *
 * @param input Article title, canonical URL, optional description, and preview.
 * @returns Display-ready copy, email, and external share actions.
 */
export function articleShareMenuViewModel(
  input: ArticleShareMenuViewModelInput,
): ArticleShareMenuViewModel {
  const articleUrl = input.articleUrl.trim();
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";
  const context = {
    articleUrl,
    description,
    ...(input.image === undefined ? {} : { image: input.image }),
    title,
  } satisfies ArticleShareTargetContext;
  const copyAction = {
    copyText: articleUrl,
    icon: "copy-link",
    id: "copy-link",
    kind: "copy",
    label: "Copy link",
  } as const satisfies ArticleShareAction;
  const emailAction = {
    href: emailShareHref(context),
    icon: "email",
    id: "email",
    kind: "email",
    label: "Email",
  } as const satisfies ArticleShareAction;
  const enabledTargetIds = input.targetIds ?? siteConfig.share.targets;
  const externalActions = enabledTargetIds.flatMap((targetId) => {
    const target = requiredShareTargetDefinition(targetId);

    return target.requiresImage === true && input.image === undefined
      ? []
      : [
          {
            href: target.buildHref(context),
            icon: target.icon,
            id: targetId,
            kind: "external",
            label: target.label,
          },
        ];
  }) satisfies readonly ArticleShareAction[];

  return {
    actions: [copyAction, emailAction, ...externalActions],
    articleUrl,
    copyText: articleUrl,
    title,
  };
}

function requiredShareTargetDefinition(
  targetId: SiteShareTargetId,
): ExternalShareTargetDefinition {
  const target = externalShareTargetDefinitions.get(targetId);

  if (target === undefined) {
    throw new Error(`Unsupported article share target: ${targetId}`);
  }

  return target;
}

function emailShareHref(context: ArticleShareTargetContext): string {
  return `mailto:?${new URLSearchParams({
    body: `${shareText(context.title, context.articleUrl)}\n\n${articleShareTargetConfig.siteName}`,
    subject: context.title,
  }).toString()}`;
}

function shareText(title: string, articleUrl: string): string {
  return `${title}\n\n${articleUrl}`;
}

function threadsShareText(title: string, articleUrl: string): string {
  const suffix =
    articleShareTargetConfig.attribution.threadsMention === undefined
      ? `\n\n${articleUrl}`
      : `\n\n${articleUrl}\n\n${articleShareTargetConfig.attribution.threadsMention}`;
  const titleLimit = threadsMaxPostLength - suffix.length;
  const safeTitle =
    title.length <= titleLimit ? title : `${title.slice(0, titleLimit - 3)}...`;

  return `${safeTitle}${suffix}`;
}

function urlWithQuery(
  href: string,
  params: Record<string, string | undefined>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  return query.length === 0 ? href : `${href}?${query}`;
}
