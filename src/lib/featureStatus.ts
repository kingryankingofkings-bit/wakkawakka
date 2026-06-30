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
  // --- Batch 0 seed: map a few already-shipped app capabilities to live ---
  // (These existed before the bible build; registered so the hub reflects reality.)
};

const DEFAULT: FeatureStatus = { status: 'planned' };

export function getFeatureStatus(id: string): FeatureStatus {
  return FEATURE_STATUS[id] || DEFAULT;
}
