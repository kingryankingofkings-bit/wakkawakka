import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { RightPanel } from '@/components/layout/RightPanel';
import { ScheduledPublisher } from '@/components/feed/ScheduledPublisher';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background worker: auto-publishes due scheduled posts */}
      <ScheduledPublisher />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:pl-64 flex min-h-screen">
        <main className="flex-1 max-w-2xl w-full mx-auto px-0 sm:px-4 py-0 pb-16 md:pb-0">
          {children}
        </main>

        {/* Right panel - visible on xl+ */}
        <div className="hidden xl:block">
          <RightPanel />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
