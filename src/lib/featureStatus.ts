/**
 * Build-status registry for bible features.
 *
 * Every one of the 2,264 bible items (1082 features + 100 innovations, keyed by
 * their generated id) defaults to `planned`. As flagship features are built out
 * batch-by-batch, they are registered here as `live` (fully working) or `beta`
 * (partial/mocked), with an `href` pointing at where the working UI lives.
 *
 * This file is the single source of truth the Feature Hub uses to show real,
 * honest progress — no feature is marked done unless it is wired here.
 */
export interface FeatureStatus {
  status: 'live' | 'beta' | 'planned';
  href?: string;
  note?: string;
}

/**
 * Explicit overrides keyed by the registry id
 * (e.g. "content-creation-and-editing--f10--auto-scheduling-and-queue-system").
 * Populated incrementally as batches land.
 */
export const FEATURE_STATUS: Record<string, FeatureStatus> = {
  // ---------------------------------------------------------------------------
  // Batch 1 — Content Creation & Editing
  // ---------------------------------------------------------------------------
  'content-creation-and-editing--f2--ai-assist-content-generator': {
    status: 'live',
    href: '/feed?create=1',
    note: 'Wakka Assist in the composer: on-device caption ideas, hashtag suggestions, and one-tap text polishing.',
  },
  'content-creation-and-editing--f9--auto-generated-captions': {
    status: 'live',
    href: '/feed?create=1',
    note: 'Caption variants generated per tone (casual / professional / playful / inspirational).',
  },
  'content-creation-and-editing--f5--alt-text-editor': {
    status: 'live',
    href: '/feed?create=1',
    note: 'Per-image alt-text fields with a missing-ALT warning for accessibility.',
  },
  'content-creation-and-editing--f61--media-formatting-and-alt-text': {
    status: 'live',
    href: '/feed?create=1',
    note: 'Multi-image grid previews with individual alt-text editors.',
  },
  'content-creation-and-editing--f10--auto-scheduling-and-queue-system': {
    status: 'live',
    href: '/scheduled',
    note: 'Schedule posts to a persisted queue that auto-publishes when their time arrives.',
  },
  'content-creation-and-editing--f36--drafts-saving-and-scheduling': {
    status: 'live',
    href: '/scheduled',
    note: 'Composer autosaves a draft and restores it on reopen; scheduling queue at /scheduled.',
  },
  'analytics-business-and-creator-tools--f601--draft-post-vault': {
    status: 'beta',
    href: '/feed?create=1',
    note: 'Single autosaved draft persists across sessions; a multi-draft vault is planned.',
  },

  // ---------------------------------------------------------------------------
  // Batch 2 — Content Discovery & Search
  // ---------------------------------------------------------------------------
  'content-discovery-and-search--f117--advanced-search-filters': {
    status: 'live',
    href: '/explore',
    note: 'has:media / has:poll / has:music filters plus recent vs. popular sorting.',
  },
  'content-discovery-and-search--f119--advanced-search-operators': {
    status: 'live',
    href: '/explore',
    note: 'Operator syntax in the search bar: from:user, @mention, #tag, has:*, sort:*.',
  },
  'content-discovery-and-search--f203--search-bar-and-advanced-operators': {
    status: 'live',
    href: '/explore',
    note: 'Unified search bar parsing advanced operators across people, posts, and tags.',
  },
  'content-discovery-and-search--f135--custom-search-filters': {
    status: 'live',
    href: '/explore',
    note: 'Composable operator + interest-category + content-type filters.',
  },
  'content-discovery-and-search--f204--search-filters': {
    status: 'live',
    href: '/explore',
    note: 'Tabbed result filtering (people / posts / tags / communities / live / audio).',
  },
  'content-discovery-and-search--f178--live-search-auto-suggest': {
    status: 'live',
    href: '/explore',
    note: 'As-you-type dropdown suggesting recent searches, matching tags, and people.',
  },
  'content-discovery-and-search--f206--search-trends-and-auto-suggest': {
    status: 'live',
    href: '/explore',
    note: 'Trending tags surfaced inline plus auto-suggest from search history.',
  },
  'content-discovery-and-search--f165--hidden-words-feed-filter': {
    status: 'live',
    href: '/explore',
    note: 'Muted keywords (managed in Explore) hide matching posts from the feed.',
  },
};

const DEFAULT: FeatureStatus = { status: 'planned' };

export function getFeatureStatus(id: string): FeatureStatus {
  return FEATURE_STATUS[id] || DEFAULT;
}
