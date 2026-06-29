'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Radio, Users, Gift, MessageCircle, Heart, X, Send, Zap, Crown, Star, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCount, formatRelativeTime } from '@/lib/utils';
import { MOCK_LIVE_STREAMS, MOCK_USERS } from '@/lib/mockData';
import { LiveComment, LiveStream } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Copy, Check } from 'lucide-react';

const GIFTS = [
  { emoji: '🎁', name: 'Gift', cost: 10 },
  { emoji: '🌟', name: 'Star', cost: 50 },
  { emoji: '💎', name: 'Diamond', cost: 100 },
  { emoji: '👑', name: 'Crown', cost: 500 },
  { emoji: '🚀', name: 'Rocket', cost: 1000 },
];

function LiveCommentItem({ comment }: { comment: LiveComment }) {
  if (comment.type === 'GIFT') {
    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 py-1">
        <Avatar src={comment.user.avatar} name={comment.user.displayName} size="xs" />
        <span className="text-xs text-yellow-300 font-semibold">{comment.user.displayName} sent {comment.giftAmount} 💎</span>
      </motion.div>
    );
  }
  if (comment.type === 'JOIN') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/50 py-0.5">
        {comment.user.displayName} joined
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 py-1">
      <Avatar src={comment.user.avatar} name={comment.user.displayName} size="xs" />
      <div>
        <span className="text-xs font-semibold text-white/80">{comment.user.displayName}</span>
        <span className="text-sm text-white ml-1.5">{comment.message}</span>
      </div>
    </motion.div>
  );
}

export default function LivePage() {
  return (
    <Suspense>
      <LivePageInner />
    </Suspense>
  );
}

function LivePageInner() {
  const searchParams = useSearchParams();
  const streamId = searchParams.get('stream');
  const stream = streamId ? MOCK_LIVE_STREAMS.find(s => s.id === streamId) : null;
  const [viewing, setViewing] = useState<LiveStream | null>(stream || null);
  const [comments, setComments] = useState<LiveComment[]>(MOCK_LIVE_STREAMS[0]?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(MOCK_LIVE_STREAMS[0]?.viewerCount || 0);
  
  // Go Live Modal State
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartId = useRef(0);

  // Simulate live comments
  useEffect(() => {
    if (!viewing) return;
    const messages = [
      '🔥🔥🔥', 'Amazing!', 'This is so good!', 'LOVE THIS', '❤️', 'Keep going!',
      'Best live ever!', '🎵🎵', 'wow', 'incredible talent', '💯', 'more!',
    ];
    const interval = setInterval(() => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      const newComment: LiveComment = {
        id: `lc_${Date.now()}`,
        user,
        message: messages[Math.floor(Math.random() * messages.length)],
        type: 'COMMENT',
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [...prev.slice(-50), newComment]);
      setViewerCount(v => v + Math.floor(Math.random() * 5 - 2));
    }, 2500);
    return () => clearInterval(interval);
  }, [viewing]);

  // Auto-scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  function sendHeart() {
    const id = heartId.current++;
    setHearts(h => [...h, { id, x: Math.random() * 80 + 10 }]);
    setTimeout(() => setHearts(h => h.filter(heart => heart.id !== id)), 2000);
  }

  function sendComment() {
    if (!commentText.trim()) return;
    const newComment: LiveComment = {
      id: `lc_${Date.now()}`,
      user: MOCK_USERS[4],
      message: commentText,
      type: 'COMMENT',
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, newComment]);
    setCommentText('');
  }

  function sendGift(gift: typeof GIFTS[0]) {
    const newComment: LiveComment = {
      id: `lc_${Date.now()}`,
      user: MOCK_USERS[4],
      message: `sent ${gift.name}`,
      type: 'GIFT',
      giftAmount: gift.cost,
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, newComment]);
    setShowGifts(false);
  }

  if (!viewing) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Live</h1>
          <Button size="sm" onClick={() => setIsGoLiveOpen(true)}>
            <Radio className="h-4 w-4" />
            Go Live
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_LIVE_STREAMS.filter(s => s.isActive).map(s => (
            <button key={s.id} onClick={() => setViewing(s)} className="rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all text-left">
              <div className="relative aspect-video bg-gradient-to-br from-red-500/20 to-primary/20">
                {s.thumbnailUrl && <img src={s.thumbnailUrl} alt={s.title} className="h-full w-full object-cover" />}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {formatCount(s.viewerCount)}
                </div>
              </div>
              <div className="p-3 flex items-start gap-3">
                <Avatar src={s.host.avatar} name={s.host.displayName} size="md" />
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.host.displayName}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {MOCK_LIVE_STREAMS.filter(s => s.isActive).length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Radio className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold">No live streams right now</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to go live!</p>
          </div>
        )}

        <Modal isOpen={isGoLiveOpen} onClose={() => setIsGoLiveOpen(false)} title="Broadcast Setup">
          <div className="p-5 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stream Title</label>
              <input 
                type="text" 
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="Catchy title for your stream"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streaming Details</p>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Server URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 truncate text-foreground">rtmp://live.wakkawakka.com/app</code>
                  <Button size="icon" variant="outline" className="flex-shrink-0" onClick={() => { setCopiedServer(true); setTimeout(() => setCopiedServer(false), 2000); }}>
                    {copiedServer ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Stream Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 truncate text-foreground">live_sk_••••••••••••</code>
                  <Button size="icon" variant="outline" className="flex-shrink-0" onClick={() => { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }}>
                    {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button className="w-full mt-2" onClick={() => { setIsGoLiveOpen(false); setLiveTitle(''); }}>
              Start Streaming
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Stream video */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900">
          {viewing.thumbnailUrl && (
            <img src={viewing.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-40" />
          )}
        </div>

        {/* Animated "live" visual */}
        <div className="relative text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-primary animate-pulse mx-auto mb-4 flex items-center justify-center">
            <Radio className="h-12 w-12 text-white" />
          </div>
          <p className="text-white text-lg font-semibold">{viewing.host.displayName}</p>
          <p className="text-white/70 text-sm">{viewing.title}</p>
        </div>

        {/* Floating hearts */}
        <AnimatePresence>
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -150, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute bottom-32 text-2xl pointer-events-none"
              style={{ left: `${heart.x}%` }}
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
          <button onClick={() => setViewing(null)} className="text-white/80 hover:text-white p-1">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-bold">LIVE</span>
              <span className="text-white/70 text-sm">{formatCount(viewerCount)}</span>
            </div>
          </div>
          <Avatar src={viewing.host.avatar} name={viewing.host.displayName} size="md" />
        </div>
      </div>

      {/* Comments + controls */}
      <div className="h-64 bg-black/80 backdrop-blur-md flex flex-col">
        {/* Comments scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
          {comments.map(c => <LiveCommentItem key={c.id} comment={c} />)}
          <div ref={commentsEndRef} />
        </div>

        {/* Gift picker */}
        <AnimatePresence>
          {showGifts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 px-4 py-2"
            >
              <div className="flex gap-3">
                {GIFTS.map(gift => (
                  <button
                    key={gift.name}
                    onClick={() => sendGift(gift)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl">{gift.emoji}</span>
                    <span className="text-xs text-white/70">{gift.cost}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendComment()}
            placeholder="Say something..."
            className="flex-1 h-9 rounded-full bg-white/10 border border-white/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15"
          />
          <button onClick={sendComment} className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-white" />
          </button>
          <button onClick={() => setShowGifts(!showGifts)} className="h-9 w-9 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Gift className="h-4 w-4 text-yellow-400" />
          </button>
          <button onClick={sendHeart} className="h-9 w-9 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Heart className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
