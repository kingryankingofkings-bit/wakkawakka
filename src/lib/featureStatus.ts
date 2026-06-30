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

  // ---------------------------------------------------------------------------
  // Batch 3 — Interpersonal & Community Engagement
  // ---------------------------------------------------------------------------
  'interpersonal-and-community-engagement--f250--comments-and-pinning': {
    status: 'live',
    href: '/feed',
    note: 'Comment threads with pin-to-top, Top/Newest sorting, likes, and replies.',
  },
  'interpersonal-and-community-engagement--f311--post-comments': {
    status: 'live',
    href: '/feed',
    note: 'Threaded comments with inline editing, replies, likes, and delete.',
  },
  'interpersonal-and-community-engagement--f320--recommendations-and-endorsements': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'LinkedIn-style skill endorsements; owners curate skills, visitors endorse.',
  },
  'interpersonal-and-community-engagement--f288--interactive-polls': {
    status: 'live',
    href: '/feed?create=1',
    note: 'Create polls in the composer; vote and see live tallies on posts.',
  },
  'interpersonal-and-community-engagement--f285--heart-reactions': {
    status: 'live',
    href: '/feed',
    note: 'Six animated reactions (Like/Love/Haha/Wow/Sad/Angry) on posts.',
  },

  // ---------------------------------------------------------------------------
  // Batch 4 — Direct Messaging & Communication
  // ---------------------------------------------------------------------------
  'direct-messaging-and-communication--f360--chat-reactions': {
    status: 'live',
    href: '/messages',
    note: 'Right-click / long-press a message to react with an emoji; tap again to remove.',
  },
  'direct-messaging-and-communication--f376--emoji-message-reactions': {
    status: 'live',
    href: '/messages',
    note: 'Six quick emoji reactions per message, shown as a count chip on the bubble.',
  },
  'direct-messaging-and-communication--f377--emoji-reactions-in-chat': {
    status: 'live',
    href: '/messages',
    note: 'Reaction picker in the message context menu.',
  },
  'direct-messaging-and-communication--f416--reaction-customization': {
    status: 'live',
    href: '/messages',
    note: 'Choose from a customizable set of quick reactions (❤️ 😂 👍 🔥 😮 😢).',
  },
  'direct-messaging-and-communication--f422--sent-message-editing': {
    status: 'live',
    href: '/messages',
    note: 'Edit your own sent text messages inline; bubbles show an "edited" label.',
  },
  'direct-messaging-and-communication--f410--pin-message': {
    status: 'live',
    href: '/messages',
    note: 'Pin a message to a banner at the top of the conversation; unpin anytime.',
  },
  'direct-messaging-and-communication--f404--message-read-receipts-detailed-view': {
    status: 'live',
    href: '/messages',
    note: 'Delivery/read ticks plus a "Read <time>" receipt on your sent messages.',
  },

  // ---------------------------------------------------------------------------
  // Batch 5 — Monetization & E-Commerce
  // ---------------------------------------------------------------------------
  'monetization-and-e-commerce--f481--e-commerce-cart': {
    status: 'live',
    href: '/shop',
    note: 'Persisted cart with quantity controls, subtotal, and a slide-out drawer.',
  },
  'monetization-and-e-commerce--f487--in-app-checkout': {
    status: 'live',
    href: '/shop',
    note: 'Multi-step checkout (summary → card → success) that records orders to /orders.',
  },
  'monetization-and-e-commerce--f476--creator-tip-links': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'Tip jar on creator profiles with presets, custom amounts, and a message.',
  },
  'monetization-and-e-commerce--f473--creator-profile-tip-links': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'Per-profile tip button wired to the persisted commerce store.',
  },
  'monetization-and-e-commerce--f479--digital-tipping-gateway': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'Tipping flow recording amount + optional message; visible under Orders.',
  },
  'monetization-and-e-commerce--f475--creator-subscriptions': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'Subscribe to creator tiers (Fan / Super Fan) with perks; manage at /orders.',
  },
  'monetization-and-e-commerce--f509--premium-subscriptions': {
    status: 'live',
    href: '/profile/maya_lifestyle',
    note: 'Recurring monthly subscription tiers per creator, cancellable any time.',
  },

  // ---------------------------------------------------------------------------
  // Batch 6 — Analytics, Business & Creator Tools
  // ---------------------------------------------------------------------------
  'analytics-business-and-creator-tools--f589--creator-analytics-dashboard': {
    status: 'live',
    href: '/analytics',
    note: 'Full dashboard: impressions, reach, follower growth, content & audience charts.',
  },
  'analytics-business-and-creator-tools--f591--creator-dashboard': {
    status: 'live',
    href: '/analytics',
    note: 'Creator overview with date-range switching (7d / 30d / 90d).',
  },
  'analytics-business-and-creator-tools--f634--revenue-breakdown-dashboard': {
    status: 'live',
    href: '/analytics',
    note: 'Revenue by source (subscriptions, tips, shop sales, bonus) with totals.',
  },
  'analytics-business-and-creator-tools--f603--feed-performance-metrics': {
    status: 'live',
    href: '/analytics',
    note: 'Impressions time-series chart across the selected date range.',
  },
  'analytics-business-and-creator-tools--f608--individual-post-performance-metrics': {
    status: 'live',
    href: '/analytics',
    note: 'Top-performing posts ranked with likes, comments, and views.',
  },
  'analytics-business-and-creator-tools--f565--audience-location-demographics': {
    status: 'live',
    href: '/analytics',
    note: 'Top audience locations with share bars.',
  },
  'analytics-business-and-creator-tools--f604--follower-demographics': {
    status: 'live',
    href: '/analytics',
    note: 'Audience gender split and location breakdown.',
  },
  'analytics-business-and-creator-tools--f572--automated-pdf-report-generator': {
    status: 'beta',
    href: '/analytics',
    note: 'One-click CSV/JSON analytics export; PDF generation is planned.',
  },

  // ---------------------------------------------------------------------------
  // Batch 7 — Privacy, Security & Safety
  // ---------------------------------------------------------------------------
  'privacy-security-and-safety--f661--block-and-mute-list': {
    status: 'live',
    href: '/safety',
    note: 'Block users from a post menu; manage the blocked list and muted words in Safety.',
  },
  'privacy-security-and-safety--f662--block-list-management': {
    status: 'live',
    href: '/safety',
    note: 'Persisted blocked-accounts list with one-tap unblock.',
  },
  'privacy-security-and-safety--f666--blocked-accounts-list': {
    status: 'live',
    href: '/safety',
    note: 'View every account you have blocked, with block time.',
  },
  'privacy-security-and-safety--f681--content-reporting-system': {
    status: 'live',
    href: '/feed',
    note: 'Report posts with a reason + detail; reports are tracked in Safety.',
  },
  'privacy-security-and-safety--f688--custom-report-reasons': {
    status: 'live',
    href: '/feed',
    note: 'Six structured report reasons plus a free-text detail field.',
  },
  'privacy-security-and-safety--f705--hidden-words-filtering': {
    status: 'live',
    href: '/safety',
    note: 'Muted words hide matching posts from the feed (managed in Safety & Explore).',
  },
  'privacy-security-and-safety--f649--active-session-auditing': {
    status: 'live',
    href: '/safety',
    note: 'Review active sessions by device/location and sign out remote ones.',
  },

  // ---------------------------------------------------------------------------
  // Batch 8 — Developer APIs & Integrations
  // ---------------------------------------------------------------------------
  'developer-apis-and-integrations--f769--api-developer-access-v2': {
    status: 'live',
    href: '/developer',
    note: 'Developer Portal to generate scoped API keys with reveal/copy/revoke.',
  },
  'developer-apis-and-integrations--f836--rest-api': {
    status: 'live',
    href: '/developer',
    note: 'Scoped API keys (posts/profile/messages/webhooks) for REST access.',
  },
  'developer-apis-and-integrations--f835--post-published-webhook': {
    status: 'live',
    href: '/developer',
    note: 'Register webhook endpoints for post.published and other events, with test send.',
  },
  'developer-apis-and-integrations--f829--oauth-2-0-authentication': {
    status: 'live',
    href: '/developer',
    note: 'Manage OAuth-connected apps and revoke their access by scope.',
  },
  'developer-apis-and-integrations--f799--direct-web-widgets': {
    status: 'live',
    href: '/developer',
    note: 'Embed-code generator for profile and post widgets (copyable iframe snippet).',
  },

  // ---------------------------------------------------------------------------
  // Batch 9 — Notifications & Time Management
  // ---------------------------------------------------------------------------
  'notifications-and-time-management--f886--do-not-disturb-mode': {
    status: 'live',
    href: '/notifications',
    note: 'Do Not Disturb silences alerts; banner shows when active.',
  },
  'notifications-and-time-management--f888--do-not-disturb-toggle': {
    status: 'live',
    href: '/notifications',
    note: 'One-tap DND toggle in notification settings.',
  },
  'notifications-and-time-management--f887--do-not-disturb-schedule': {
    status: 'live',
    href: '/notifications',
    note: 'Scheduled quiet hours with start/end times (handles overnight windows).',
  },
  'notifications-and-time-management--f941--push-schedule-quiet-hours': {
    status: 'live',
    href: '/notifications',
    note: 'Quiet-hours window that auto-activates by current time.',
  },
  'notifications-and-time-management--f921--notification-category-mutes': {
    status: 'live',
    href: '/notifications',
    note: 'Per-category toggles (likes/comments/follows/mentions/messages/live/tips).',
  },
  'notifications-and-time-management--f924--notification-filtering': {
    status: 'live',
    href: '/notifications',
    note: 'Filter by type tabs plus category mutes applied to the list.',
  },
  'notifications-and-time-management--f934--notification-types-filter': {
    status: 'live',
    href: '/notifications',
    note: 'Tabbed type filter (All / Mentions / Likes / Comments / Follows / DMs / Live).',
  },
  'notifications-and-time-management--f881--daily-limit-reminders': {
    status: 'live',
    href: '/notifications',
    note: 'Digital-wellbeing card with an adjustable daily time limit and break reminder.',
  },

  // ---------------------------------------------------------------------------
  // Batch 10 — Account Settings & Authentication
  // ---------------------------------------------------------------------------
  'account-settings-and-authentication--f1029--download-your-data': {
    status: 'live',
    href: '/account',
    note: 'Export a JSON archive of your profile, drafts, orders, and settings.',
  },
  'account-settings-and-authentication--f1022--data-export-utility': {
    status: 'live',
    href: '/account',
    note: 'One-click account data archive aggregated from all local stores.',
  },
  'account-settings-and-authentication--f1012--connected-accounts': {
    status: 'live',
    href: '/account',
    note: 'Connect/disconnect Google, Apple, GitHub, and X login providers.',
  },
  'account-settings-and-authentication--f1002--app-passwords': {
    status: 'live',
    href: '/account',
    note: 'Generate and revoke labelled app-specific passwords.',
  },
  'account-settings-and-authentication--f1044--login-alerts-and-unrecognized-device-tracking': {
    status: 'live',
    href: '/account',
    note: 'Login-alerts toggle plus recent-login list flagging unrecognized devices.',
  },
  'account-settings-and-authentication--f978--account-deactivation': {
    status: 'live',
    href: '/account',
    note: 'Pause your account (with confirm) and reactivate any time; data is kept.',
  },
  'account-settings-and-authentication--f979--account-deactivation-and-deletion': {
    status: 'live',
    href: '/account',
    note: 'Deactivation flow with a two-step confirmation.',
  },
};

const DEFAULT: FeatureStatus = { status: 'planned' };

export function getFeatureStatus(id: string): FeatureStatus {
  return FEATURE_STATUS[id] || DEFAULT;
}
