"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { RightPanel } from "@/components/layout/RightPanel";
import { CreatePostModalWrapper } from "@/components/layout/CreatePostModalWrapper";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullWidthWorkspace = pathname
    ? pathname.startsWith("/servers") ||
      pathname.startsWith("/forum") ||
      pathname.startsWith("/camera")
    : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar via Parallel Route */}
      <div className="hidden md:block">
        {sidebar}
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "md:pl-64 flex min-h-screen",
          isFullWidthWorkspace && "md:pl-64",
        )}
      >
        <main
          className={cn(
            "flex-1 w-full py-0",
            isFullWidthWorkspace
              ? "max-w-none px-0 pb-0"
              : "max-w-2xl mx-auto px-0 sm:px-4 pb-16 md:pb-0",
          )}
        >
          {children}
        </main>

        {/* Right panel - visible on xl+ */}
        {!isFullWidthWorkspace && (
          <div className="hidden xl:block">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {!isFullWidthWorkspace && <MobileNav />}

      {/* Global Modals */}
      <CreatePostModalWrapper />
    </div>
  );
}
