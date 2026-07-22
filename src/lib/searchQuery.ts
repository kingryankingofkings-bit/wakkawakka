/**
 * Advanced search query parsing + matching (Category 2: Discovery & Search).
 *
 * Supports operator syntax in a single search box:
 *   from:alice          — posts authored by @alice
 *   @bob                — posts mentioning @bob (in text)
 *   #travel             — posts tagged #travel
 *   has:media           — posts with image/video attachments
 *   has:poll            — posts containing a poll
 *   has:music           — posts with an attached track
 *   sort:popular        — order by engagement (default: recent)
 *   plain words         — full-text match against post content
 *
 * Pure + dependency-free so it can power the explore page and be unit-tested.
 */
import type { Post } from '@/types';

export interface ParsedQuery {
  terms: string[];
  tags: string[];
  mentions: string[];
  from: string[];
  has: { media: boolean; poll: boolean; music: boolean };
  sort: 'recent' | 'popular';
  /** True when the query has no actionable tokens. */
  isEmpty: boolean;
}

export function parseSearchQuery(input: string): ParsedQuery {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const q: ParsedQuery = {
    terms: [],
    tags: [],
    mentions: [],
    from: [],
    has: { media: false, poll: false, music: false },
    sort: 'recent',
    isEmpty: true,
  };

  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (lower.startsWith('from:') && lower.length > 5) {
      q.from.push(lower.slice(5).replace(/^@/, ''));
    } else if (lower.startsWith('has:')) {
      const v = lower.slice(4);
      if (v === 'media' || v === 'image' || v === 'video') q.has.media = true;
      else if (v === 'poll') q.has.poll = true;
      else if (v === 'music' || v === 'audio') q.has.music = true;
    } else if (lower.startsWith('sort:')) {
      q.sort = lower.slice(5) === 'popular' ? 'popular' : 'recent';
    } else if (tok.startsWith('#') && tok.length > 1) {
      q.tags.push(tok.slice(1).toLowerCase());
    } else if (tok.startsWith('@') && tok.length > 1) {
      q.mentions.push(tok.slice(1).toLowerCase());
    } else {
      q.terms.push(lower);
    }
  }

  q.isEmpty =
    q.terms.length === 0 &&
    q.tags.length === 0 &&
    q.mentions.length === 0 &&
    q.from.length === 0 &&
    !q.has.media &&
    !q.has.poll &&
    !q.has.music;

  return q;
}

function engagement(p: Post): number {
  return p.likesCount + p.commentsCount * 2 + p.sharesCount * 3;
}

export function matchPost(post: Post, q: ParsedQuery): boolean {
  const content = post.content.toLowerCase();
  const tags = post.hashtags.map((h) => h.toLowerCase());

  if (q.has.media && post.mediaUrls.length === 0) return false;
  if (q.has.poll && !post.poll) return false;
  if (q.has.music && !post.musicTrack) return false;

  if (q.from.length) {
    const author = post.author.username.toLowerCase();
    if (!q.from.some((f) => author === f || author.includes(f))) return false;
  }
  if (q.tags.length && !q.tags.every((t) => tags.some((pt) => pt.includes(t)))) return false;
  if (q.mentions.length && !q.mentions.every((m) => content.includes(`@${m}`))) return false;
  if (q.terms.length && !q.terms.every((t) => content.includes(t))) return false;

  return true;
}

/** Filter a post list by a parsed query and apply the requested ordering. */
export function filterAndSortPosts(posts: Post[], q: ParsedQuery): Post[] {
  const filtered = q.isEmpty ? posts.slice() : posts.filter((p) => matchPost(p, q));
  if (q.sort === 'popular') {
    filtered.sort((a, b) => engagement(b) - engagement(a));
  } else {
    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return filtered;
}

/** Does a post contain any muted keyword (case-insensitive, content + tags)? */
export function isMuted(post: Post, mutedKeywords: string[]): boolean {
  if (mutedKeywords.length === 0) return false;
  const haystack = (post.content + ' ' + post.hashtags.join(' ')).toLowerCase();
  return mutedKeywords.some((w) => w.trim() && haystack.includes(w.toLowerCase().trim()));
}
