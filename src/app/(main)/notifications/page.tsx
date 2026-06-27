'use client';

import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Share2, Radio, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useNotificationStore } from '@/store/notificationStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import { NotificationType } from '@/types';

const NOTIF_TABS = ['All', 'Mentions', 'Likes', 'Comments', 'Follows', 'DMs', 'Live'] as const;
type NotifTab = typeof NOTIF_TABS[number];

function getNotifIcon(type: NotificationType) {
  const map: Record<NotificationType, { icon: typeof Bell; color: string }> = {
    LIKE: { icon: Heart, color: 'text-red-500 bg-red-500/10' },
    COMMENT: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10' },
    FOLLOW: { icon: UserPlus, color: 'text-green-500 bg-green-500/10' },
    MESSAGE: { icon: MessageCircle, color: 'text-purple-500 bg-purple-500/10' },
    MENTION: { icon: AtSign, color: 'text-orange-500 bg-orange-500/10' },
    SHARE: { icon: Share2, color: 'text-teal-500 bg-teal-500/10' },
    LIVE: { icon: Radio, color: 'text-red-500 bg-red-500/10' },
    GIFT: { icon: Gift, color: 'text-yellow-500 bg-yellow-500/10' },
    SUBSCRIPTION: { icon: Heart, color: 'text-pink-500 bg-pink-500/10' },
    TIP: { icon: Gift, color: 'text-yellow-500 bg-yellow-500/10' },
    BADGE: { icon: Bell, color: 'text-primary bg-primary/10' },
  };
  return map[type] || { icon: Bell, color: 'text-primary bg-primary/10' };
}

const TAB_FILTER: Record<NotifTab, NotificationType[]> = {
  All: [],
  Mentions: ['MENTION'],
  Likes: ['LIKE'],
  Comments: ['COMMENT'],
  Follows: ['FOLLOW'],
  DMs: ['MESSAGE'],
  Live: ['LIVE', 'GIFT'],
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [tab, setTab] = useState<NotifTab>('All');

  const filtered = tab === 'All'
    ? notifications
    : notifications.filter(n => TAB_FILTER[tab].includes(n.type));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 pb-1">
          {NOTIF_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="py-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">When someone interacts with you, you'll see it here</p>
            </div>
          ) : (
            filtered.map((notif, i) => {
              const { icon: Icon, color } = getNotifIcon(notif.type);
              return (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    'flex items-start gap-3 w-full px-4 py-3.5 border-b border-border/50 hover:bg-muted/50 transition-colors text-left',
                    !notif.isRead && 'bg-primary/3'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={notif.actor.avatar} name={notif.actor.displayName} size="md" />
                    <span className={cn('absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center', color)}>
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">{notif.actor.displayName}</span>{' '}
                      <span className="text-muted-foreground">{notif.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(notif.createdAt)}</p>
                    {notif.type === 'FOLLOW' && (
                      <div className="mt-2">
                        <Button size="xs" variant="outline">Follow back</Button>
                      </div>
                    )}
                  </div>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
