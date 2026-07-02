"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  Film,
  Radio,
  MessageCircle,
  Bell,
  Users,
  ShoppingBag,
  BarChart2,
  User,
  Settings,
  Zap,
  LogOut,
  Mic,
  BookMarked,
  Plus,
  UserPlus,
  Calendar,
  Flag,
  Store,
  Clock,
  Sun,
  Moon,
  Shield,
  Server,
  Briefcase,
  GraduationCap,
  Newspaper,
  MessageSquare,
  Camera,
  Map,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useMessageStore } from "@/store/messageStore";
import { signOut } from "@/lib/firebase";
import { CURRENT_USER } from "@/lib/mockData";

import { useUIStore } from "@/store/uiStore";

type NavItem = { href: string; icon: any; label: string; badge?: string };

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/forums", icon: MessageSquare, label: "Forums" },
  { href: "/servers", icon: Server, label: "Servers" },
  { href: "/reels", icon: Film, label: "Reels" },
  { href: "/music", icon: Music, label: "Music" },
  { href: "/live", icon: Radio, label: "Live" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/learning", icon: GraduationCap, label: "Learning" },
  { href: "/articles", icon: Newspaper, label: "Articles" },
  { href: "/messages", icon: MessageCircle, label: "Messages", badge: "dm" },
  { href: "/notifications", icon: Bell, label: "Notifications", badge: "notif" },
  { href: "/friends", icon: UserPlus, label: "Friends" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/brand-pages", icon: Flag, label: "Pages" },
  { href: "/communities", icon: Users, label: "Communities" },
  { href: "/camera", icon: Camera, label: "Camera" },
  { href: "/map", icon: Map, label: "Snap Map" },
  { href: "/marketplace", icon: Store, label: "Marketplace" },
  { href: "/memories", icon: Clock, label: "Memories" },
  { href: "/audio-rooms", icon: Mic, label: "Audio Rooms" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/bookmarks", icon: BookMarked, label: "Bookmarks" },
  { href: "/scheduling", icon: Calendar, label: "Scheduling" },
];

function getNavItemsForProfile(type?: string): NavItem[] {
  const t = type || "PERSONAL";
  // Filter based on persona
  return ALL_NAV_ITEMS.filter((item) => {
    // Common items for all profiles
    if (["/feed", "/notifications", "/messages", "/settings", "/bookmarks"].includes(item.href)) return true;
    
    if (t === "STREAMING") {
      return ["/live", "/reels", "/audio-rooms", "/camera", "/explore", "/servers", "/music"].includes(item.href);
    }
    if (t === "PROFESSIONAL") {
      return ["/jobs", "/articles", "/learning", "/events", "/analytics", "/brand-pages", "/shop", "/scheduling"].includes(item.href);
    }
    if (t === "LEARNING") {
      return ["/learning", "/articles", "/forums", "/events"].includes(item.href);
    }
    if (t === "SOCIALIZING" || t === "PERSONAL") {
      return ["/explore", "/friends", "/communities", "/map", "/memories", "/marketplace", "/events", "/servers", "/music", "/shop"].includes(item.href);
    }
    if (t === "ANONYMOUS") {
      return ["/forums", "/explore", "/audio-rooms"].includes(item.href);
    }
    return true; // Fallback
  });
}

export function Sidebar() {
  const pathname = usePathname();
  const activeProfile = useAuthStore((s) => s.activeProfile) || CURRENT_USER;
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const conversations = useMessageStore((s) => s.conversations);
  const dmUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const { theme, setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
    } catch {}
    useAuthStore.getState().logout();
    window.location.href = "/";
  }

  const currentTheme = theme === "system" ? "dark" : theme; // default fallback visual

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-white animate-pulse" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Wakka
        </span>
      </div>

      {/* Create post button */}
      <div className="px-3 pt-4">
        <button
          onClick={() => useUIStore.getState().setActiveModal("createPost")}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-md hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {getNavItemsForProfile(activeProfile?.type).map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const badgeCount =
            badge === "dm" ? dmUnread : badge === "notif" ? unreadCount : 0;

          return (
            <motion.div
              key={href}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            </motion.div>
          );
        })}

        <div className="pt-2 border-t border-border mt-2 space-y-0.5">
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link
              href={`/profile/${activeProfile?.username}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                pathname.startsWith("/profile")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              Profile
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                pathname === "/settings"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              Settings
            </Link>
          </motion.div>
          {activeProfile?.isAdmin && (
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href="/admin/moderation"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  pathname.startsWith("/admin/moderation")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Shield className="h-5 w-5 flex-shrink-0 text-primary animate-pulse" />
                Moderation
              </Link>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Theme Toggle Widget */}
      <div className="px-3 py-2 border-t border-border bg-card/20">
        <button
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-all relative overflow-hidden active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              {currentTheme === "dark" ? (
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

      {/* User footer with Profile Switcher */}
      <div className="border-t border-border p-3 relative">
        <AnimatePresence>
          {isProfileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-3 w-56 mb-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="p-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Switch Profile</p>
              </div>
              <div className="p-1 max-h-60 overflow-y-auto">
                {useAuthStore.getState().profiles?.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      useAuthStore.getState().setActiveProfile(profile);
                      setIsProfileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm hover:bg-muted transition-colors",
                      activeProfile?.id === profile.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <Avatar src={profile.avatar} name={profile.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.displayName}</p>
                      <p className="text-xs opacity-80 truncate">{profile.type}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-1 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-left"
        >
          <Avatar src={activeProfile?.avatar} name={activeProfile?.displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {activeProfile?.displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              @{activeProfile?.username}
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider">
                {activeProfile?.type || 'PERSONAL'}
              </span>
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
