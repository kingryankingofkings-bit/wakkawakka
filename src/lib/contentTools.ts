/**
 * Wakka Assist — on-device content tools (Category 1: Content Creation & Editing).
 *
 * These are deterministic, dependency-free heuristics that run entirely in the
 * browser (no external AI API). They power the composer's caption generator,
 * hashtag suggester, text polisher, and alt-text starter. Kept as pure
 * functions so the behaviour is predictable and unit-testable.
 *
 * Bible features implemented on top of this module:
 *   - AI Assist Content Generator
 *   - Auto-Generated Captions (caption variants)
 *   - Hashtag suggestion / discovery
 *   - Alt Text Editor (starter descriptions)
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'this', 'that', 'these',
  'those', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'at',
  'as', 'by', 'from', 'so', 'just', 'about', 'into', 'over', 'after', 'im',
  'get', 'got', 'will', 'can', 'all', 'out', 'up', 'now', 'new', 'how', 'why',
]);

/** Curated topic -> hashtag expansions to enrich suggestions. */
const TOPIC_TAGS: Record<string, string[]> = {
  travel: ['travel', 'wanderlust', 'explore', 'adventure'],
  food: ['food', 'foodie', 'recipe', 'yum'],
  fitness: ['fitness', 'workout', 'health', 'gains'],
  music: ['music', 'newmusic', 'nowplaying'],
  art: ['art', 'design', 'creative', 'illustration'],
  tech: ['tech', 'coding', 'developer', 'ai'],
  game: ['gaming', 'gamer', 'twitch'],
  photo: ['photography', 'photooftheday', 'photo'],
  fashion: ['fashion', 'ootd', 'style'],
  business: ['business', 'startup', 'entrepreneur'],
  nature: ['nature', 'outdoors', 'naturelovers'],
  pet: ['pets', 'dogsofwakka', 'catsofwakka'],
};

export type CaptionTone = 'casual' | 'professional' | 'playful' | 'inspirational';

const TONE_LABELS: Record<CaptionTone, string> = {
  casual: 'Casual',
  professional: 'Professional',
  playful: 'Playful',
  inspirational: 'Inspirational',
};

export const CAPTION_TONES = Object.keys(TONE_LABELS) as CaptionTone[];
export function toneLabel(t: CaptionTone): string {
  return TONE_LABELS[t];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#@]\w+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Rank the most salient keywords in a piece of text. */
export function keywords(text: string, max = 5): string[] {
  const counts = new Map<string, number>();
  for (const w of tokenize(text)) {
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, max)
    .map(([w]) => w);
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Suggest relevant hashtags from the draft text (deduped, lowercased). */
export function suggestHashtags(text: string, max = 6): string[] {
  const kws = keywords(text, 8);
  const out = new Set<string>();

  for (const kw of kws) {
    for (const [topic, tags] of Object.entries(TOPIC_TAGS)) {
      if (kw.includes(topic) || topic.includes(kw)) tags.forEach((t) => out.add(t));
    }
  }
  // Always seed with the strongest raw keywords as tags too.
  for (const kw of kws) {
    if (out.size >= max) break;
    if (kw.length >= 4) out.add(kw.replace(/[^a-z0-9]/g, ''));
  }
  if (out.size === 0) ['wakka', 'community', 'trending'].forEach((t) => out.add(t));
  return [...out].slice(0, max);
}

/**
 * Generate up to 3 caption variants in the requested tone, seeded by the draft.
 * Falls back to topic-agnostic templates when the draft is empty.
 */
export function generateCaptions(text: string, tone: CaptionTone = 'casual'): string[] {
  const kws = keywords(text, 3);
  const subject = kws[0] ? titleCase(kws[0]) : 'today';
  const second = kws[1] ? kws[1] : 'the moment';

  const banks: Record<CaptionTone, string[]> = {
    casual: [
      `${subject} hits different ✨`,
      `Just vibing with ${second} lately.`,
      `Had to share this one — thoughts?`,
    ],
    professional: [
      `Sharing some thoughts on ${second}.`,
      `A quick look at ${subject} and why it matters.`,
      `Key takeaways on ${second} — would love your perspective.`,
    ],
    playful: [
      `POV: ${second} took over my whole day 😅`,
      `${subject}? obsessed. that's the post.`,
      `Not me making ${second} my entire personality 🙈`,
    ],
    inspirational: [
      `${subject} is a reminder to keep going. 🌱`,
      `Small steps with ${second} lead somewhere big.`,
      `Grateful for ${second} and everything it's teaching me.`,
    ],
  };

  return banks[tone];
}

/** Lightly polish the draft: trim, fix spacing, capitalize, ensure end punctuation. */
export function improveText(text: string): string {
  let t = text.replace(/\s+/g, ' ').trim();
  if (!t) return t;
  // Capitalize first letter of each sentence.
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
  // Ensure it ends with punctuation.
  if (!/[.!?…]$/.test(t)) t += '.';
  return t;
}

/** Starter alt-text template to nudge accessible descriptions. */
export function altTextStarter(index: number): string {
  const n = index + 1;
  return `Image ${n}: describe the main subject, setting, and any visible text…`;
}
