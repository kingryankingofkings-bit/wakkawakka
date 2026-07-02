"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, _Film, MessageCircle, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import { useMessageStore } from "@/store/messageStore";

const MOBILE_NAV = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/feed?create=1", icon: Plus, label: "Create", isCreate: true },
  { href: "/notifications", icon: Bell, label: "Alerts", badge: "notif" },
  { href: "/messages", icon: MessageCircle, label: "DMs", badge: "dm" },
];

export function MobileNav() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const conversations = useMessageStore((s) => s.conversations);
  const dmUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV.map(({ href, icon: Icon, label, isCreate, badge }) => {
          const isActive =
            pathname === href ||
            (href !== "/feed?create=1" && pathname.startsWith(href));
          const badgeCount =
            badge === "dm" ? dmUnread : badge === "notif" ? unreadCount : 0;

          if (isCreate) {
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon className="h-6 w-6" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
