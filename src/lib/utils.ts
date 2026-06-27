import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  return format(d, 'MMM d, yyyy');
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches.map(t => t.slice(1).toLowerCase()))] : [];
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches.map(t => t.slice(1).toLowerCase()))] : [];
}

export function highlightText(text: string): string {
  return text
    .replace(/#([a-zA-Z0-9_]+)/g, '<a href="/explore?tag=$1" class="text-primary hover:underline">#$1</a>')
    .replace(/@([a-zA-Z0-9_]+)/g, '<a href="/profile/$1" class="text-primary hover:underline">@$1</a>');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateUsername(displayName: string): string {
  return slugify(displayName).replace(/-/g, '_') + Math.floor(Math.random() * 9999);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(getFileExtension(filename));
}

export function isVideoFile(filename: string): boolean {
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(getFileExtension(filename));
}

export function isAudioFile(filename: string): boolean {
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(getFileExtension(filename));
}

export function computeFeedScore(post: {
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isFollowing?: boolean;
  interestMatch?: number;
}): number {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 1 - ageHours / 48);
  const engagementScore =
    (post.likesCount * 1 + post.commentsCount * 3 + post.sharesCount * 5) /
    Math.max(post.viewsCount, 1);
  const followingBonus = post.isFollowing ? 0.3 : 0;
  const interestBonus = (post.interestMatch || 0) * 0.2;

  return recencyScore * 0.4 + engagementScore * 0.3 + followingBonus + interestBonus;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

export const BADGE_ICONS: Record<string, string> = {
  EARLY_ADOPTER: '🌟',
  VERIFIED: '✅',
  CREATOR: '🎨',
  INFLUENCER: '📣',
  STREAK_7: '🔥',
  STREAK_30: '💫',
  STREAK_100: '⚡',
  TOP_CONTRIBUTOR: '🏆',
  HELPFUL: '🤝',
  POPULAR: '💎',
};

export function getAccentColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    blue: 'hsl(220, 90%, 56%)',
    purple: 'hsl(270, 90%, 56%)',
    pink: 'hsl(330, 90%, 56%)',
    red: 'hsl(0, 90%, 56%)',
    orange: 'hsl(30, 90%, 56%)',
    yellow: 'hsl(50, 90%, 56%)',
    green: 'hsl(140, 90%, 40%)',
    teal: 'hsl(175, 90%, 40%)',
  };
  return colorMap[color] || colorMap.blue;
}
