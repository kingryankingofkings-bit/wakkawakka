'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Film, Radio, MessageCircle, Bell, Users, ShoppingBag, BarChart2, User, Settings, Zap, LogOut, Mic, BookMarked, Plus, UserPlus, Calendar, Flag, Store, Clock, Sun, Moon, Sparkles, CalendarClock, Package, ShieldCheck, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useMessageStore } from '@/store/messageStore';
import { signOut } from '@/lib/firebase';
import { CURRENT_USER } from '@/lib/mockData';

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/reels', icon: Film, label: 'Reels' },
  { href: '/live', icon: Radio, label: 'Live' },
  { href: '/messages', icon: MessageCircle, label: 'Messages', badge: 'dm' },
  { href: '/notifications', icon: Bell, label: 'Notifications', badge: 'notif' },
  { href: '/friends', icon: UserPlus, label: 'Friends' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/pages', icon: Flag, label: 'Pages' },
  { href: '/communities', icon: Users, label: 'Communities' },
  { href: '/marketplace', icon: Store, label: 'Marketplace' },
  { href: '/memories', icon: Clock, label: 'Memories' },
  { href: '/audio-rooms', icon: Mic, label: 'Audio Rooms' },
  { href: '/shop', icon: ShoppingBag, label: 'Shop' },
  { href: '/orders', icon: Package, label: 'Orders' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/bookmarks', icon: BookMarked, label: 'Bookmarks' },
  { href: '/scheduled', icon: CalendarClock, label: 'Scheduled' },
  { href: '/safety', icon: ShieldCheck, label: 'Safety' },
  { href: '/developer', icon: Code2, label: 'Developer' },
  { href: '/feature-hub', icon: Sparkles, label: 'Feature Hub' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore(s => s.user) || CURRENT_USER;
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const conversations = useMessageStore(s => s.conversations);
  const dmUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    try { await signOut(); } catch {}
    useAuthStore.getState().logout();
    window.location.href = '/';
  }

  const currentTheme = theme === 'system' ? 'dark' : theme; // default fallback visual

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-white animate-pulse" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Wakka</span>
      </div>

      {/* Create post button */}
      <div className="px-3 pt-4">
        <Link
          href="/feed?create=1"
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-md hover:shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const badgeCount = badge === 'dm' ? dmUnread : badge === 'notif' ? unreadCount : 0;

          return (
            <motion.div key={href} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            </motion.div>
          );
        })}

        <div className="pt-2 border-t border-border mt-2 space-y-0.5">
          <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Link
              href={`/profile/${user?.username}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/profile') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              Profile
            </Link>
          </motion.div>
          <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              Settings
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Theme Toggle Widget */}
      <div className="px-3 py-2 border-t border-border bg-card/20">
        <button
          onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-all relative overflow-hidden active:scale-95"
          title="Toggle Dark/Light Mode"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ y: 15, opacity: 0, rotate: 40 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -15, opacity: 0, rotate: -40 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {currentTheme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors group">
          <Avatar src={user?.avatar} name={user?.displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
