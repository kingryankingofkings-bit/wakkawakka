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
};

const DEFAULT: FeatureStatus = { status: 'planned' };

export function getFeatureStatus(id: string): FeatureStatus {
  return FEATURE_STATUS[id] || DEFAULT;
}
