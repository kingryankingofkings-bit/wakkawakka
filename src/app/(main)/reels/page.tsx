'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Music2,
  Play,
  X,
  Send,
} from 'lucide-react';
import { cn, formatCount } from '@/lib/utils';
import { MOCK_POSTS, MOCK_USERS } from '@/lib/mockData';
import { Post, User } from '@/types';

/* ─── Mock reel data ─────────────────────────────────── */
interface Reel {
  id: string;
  author: User;
  caption: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  musicTrack: { title: string; artist: string };
  gradient: string;
  userLiked: boolean;
}

const GRADIENTS = [
  'from-purple-900 via-violet-800 to-indigo-900',
  'from-rose-900 via-pink-800 to-red-900',
  'from-emerald-900 via-teal-800 to-cyan-900',
  'from-amber-900 via-orange-800 to-yellow-900',
  'from-blue-900 via-indigo-800 to-purple-900',
  'from-slate-900 via-gray-800 to-zinc-900',
  'from-fuchsia-900 via-purple-800 to-pink-900',
  'from-sky-900 via-blue-800 to-indigo-900',
];

const VIDEO_POSTS = MOCK_POSTS.filter(
  (p) => p.type === 'VIDEO' || p.type === 'REEL'
);

const MOCK_REELS: Reel[] = [
  ...VIDEO_POSTS.map((p, i) => ({
    id: p.id,
    author: p.author,
    caption: p.content,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    sharesCount: p.sharesCount,
    musicTrack: p.musicTrack
      ? { title: p.musicTrack.title, artist: p.musicTrack.artist }
      : { title: 'Original Sound', artist: p.author.displayName },
    gradient: GRADIENTS[i % GRADIENTS.length],
    userLiked: !!p.userReaction,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `reel-extra-${i}`,
    author: MOCK_USERS[i % MOCK_USERS.length],
    caption: [
      'Drop everything and watch this 🔥 #viral #trending #fyp',
      'POV: you found your new fav creator 🎨 #art #creative',
      'This transition took me 3 hours 😤 totally worth it #transition',
      'Living my best life one reel at a time ✨ #lifestyle #vibes',
      'Tutorial: how to make everyone jealous of your coding setup 💻 #tech #setup',
      'Unexpected ending... 👀 #surprise #satisfying',
    ][i],
    likesCount: Math.floor(Math.random() * 100000) + 1000,
    commentsCount: Math.floor(Math.random() * 5000) + 100,
    sharesCount: Math.floor(Math.random() * 10000) + 500,
    musicTrack: {
      title: ['Summer Vibes', 'Midnight Drive', 'Neon Lights', 'Golden Hour', 'City Pulse', 'Echo Chamber'][i],
      artist: ['DJ Wave', 'Synthwave Pro', 'Lo-Fi Beats', 'ChillHop', 'UrbanRhythm', 'NightOwl'][i],
    },
    gradient: GRADIENTS[(i + 2) % GRADIENTS.length],
    userLiked: false,
  })),
];

/* ─── Comment drawer ─────────────────────────────────── */
const SAMPLE_COMMENTS = [
  { id: 'c1', user: MOCK_USERS[0], text: 'This is absolutely incredible! 🔥', likes: 342 },
  { id: 'c2', user: MOCK_USERS[1], text: 'How did you do that transition?? teach me please', likes: 128 },
  { id: 'c3', user: MOCK_USERS[2], text: 'Sending this to my entire contact list 😂', likes: 89 },
  { id: 'c4', user: MOCK_USERS[3], text: 'Been watching this on repeat for 20 mins', likes: 567 },
  { id: 'c5', user: MOCK_USERS[4], text: 'Algorithm brought me here and I have zero regrets', likes: 234 },
];

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  commentsCount: number;
}

function CommentDrawer({ open, onClose, commentsCount }: CommentDrawerProps) {
  const [comment, setComment] = useState('');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 bg-black/50 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 bg-zinc-900 rounded-t-2xl flex flex-col"
            style={{ height: '70%' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-semibold text-white">
                {formatCount(commentsCount)} Comments
              </span>
              <button onClick={onClose} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
              {SAMPLE_COMMENTS.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img
                    src={c.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user.id}`}
                    alt={c.user.displayName}
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.user.displayName}</span>
                      <span className="text-xs text-white/40">2h</span>
                    </div>
                    <p className="text-sm text-white/80 mt-0.5">{c.text}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <button className="text-xs text-white/40 hover:text-white">Reply</button>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Heart size={12} />
                        <span>{formatCount(c.likes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-white/10 flex gap-3 items-center">
              <img
                src={MOCK_USERS[4].avatar}
                alt="You"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 flex items-center bg-white/10 rounded-full px-4 py-2 gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none border-0"
                />
                {comment.trim() && (
                  <button
                    onClick={() => setComment('')}
                    className="text-primary shrink-0"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Single reel card ───────────────────────────────── */
interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
}

function ReelCard({ reel, isActive }: ReelCardProps) {
  const [liked, setLiked] = useState(reel.userLiked);
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [muted, setMuted] = useState(true);
  const [commentOpen, setCommentOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const heartIdRef = useRef(0);

  // Simulate progress bar
  useEffect(() => {
    if (!isActive) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    const duration = 15000; // 15 second simulated reel
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleLike = () => {
    setLiked((prev) => {
      setLikesCount((c) => prev ? c - 1 : c + 1);
      return !prev;
    });
    // Spawn floating hearts
    const id = heartIdRef.current++;
    const x = Math.random() * 60 + 20;
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  const musicTitle = `${reel.musicTrack.title} - ${reel.musicTrack.artist}`;
  const repeated = `${musicTitle}     •     ${musicTitle}     •     `;

  return (
    <div className="relative w-full h-screen shrink-0 overflow-hidden bg-black select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-white/20">
        <motion.div
          className="h-full bg-white"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Background gradient + play icon */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', reel.gradient)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={isActive ? { scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] } : {}}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-white/20"
          >
            <Play size={120} fill="white" />
          </motion.div>
        </div>
        {/* Overlay vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Floating hearts */}
      <AnimatePresence>
        {floatingHearts.map((h) => (
          <motion.div
            key={h.id}
            className="absolute bottom-40 z-20 pointer-events-none"
            style={{ left: `${h.x}%` }}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -160, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <Heart size={36} fill="#ef4444" className="text-red-500" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Comment drawer */}
      <CommentDrawer
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        commentsCount={reel.commentsCount}
      />

      {/* Bottom overlay: author info + music ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 px-4 pointer-events-none">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          <img
            src={reel.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.author.id}`}
            alt={reel.author.displayName}
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
          />
          <div>
            <span className="text-white font-semibold text-sm">@{reel.author.username}</span>
            {reel.author.isVerified && (
              <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">✓</span>
            )}
          </div>
          <button className="ml-2 px-3 py-0.5 border border-white rounded-full text-white text-xs font-medium hover:bg-white/10 transition-colors">
            Follow
          </button>
        </div>

        {/* Caption */}
        <p className="text-white text-sm mb-3 line-clamp-2 pointer-events-none">{reel.caption}</p>

        {/* Music ticker */}
        <div className="flex items-center gap-2 pointer-events-none overflow-hidden">
          <Music2 size={14} className="text-white shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="overflow-hidden flex-1">
            <motion.div
              className="flex whitespace-nowrap text-white/80 text-xs"
              animate={{ x: [0, -300] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            >
              {repeated.repeat(4)}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-6">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.4 }}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              liked ? 'text-red-500' : 'text-white'
            )}
          >
            <Heart size={28} fill={liked ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setCommentOpen(true)} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white">
            <MessageCircle size={28} />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(reel.commentsCount)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white">
            <Share2 size={26} />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(reel.sharesCount)}</span>
        </button>

        {/* Sound */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

        {/* Spinning music disc */}
        <motion.div
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="w-11 h-11 rounded-full border-2 border-white overflow-hidden"
        >
          <img
            src={`https://picsum.photos/seed/${reel.id}disc/44/44`}
            alt="disc"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(MOCK_REELS.length - 1, idx));
    setCurrentIndex(clamped);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: clamped * window.innerHeight, behavior: 'smooth' });
    }
  }, []);

  // Wheel navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;
      isScrolling.current = true;
      if (e.deltaY > 0) goTo(currentIndex + 1);
      else if (e.deltaY < 0) goTo(currentIndex - 1);
      setTimeout(() => { isScrolling.current = false; }, 600);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goTo(currentIndex + 1);
      else if (e.key === 'ArrowUp') goTo(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, goTo]);

  // Touch navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    };
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [currentIndex, goTo]);

  // Sync scroll position when index changes externally
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = currentIndex * window.innerHeight;
    }
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-hidden relative"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {MOCK_REELS.map((reel, i) => (
        <div key={reel.id} style={{ scrollSnapAlign: 'start' }}>
          <ReelCard reel={reel} isActive={i === currentIndex} />
        </div>
      ))}

      {/* Dot indicators */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5">
        {MOCK_REELS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'w-1 rounded-full transition-all duration-300',
              i === currentIndex ? 'h-6 bg-white' : 'h-1.5 bg-white/40'
            )}
          />
        ))}
      </div>
    </div>
  );
}
