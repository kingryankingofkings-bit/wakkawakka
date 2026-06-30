import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function FeatureHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="md:pl-64 min-h-screen">
        <main className="max-w-6xl w-full mx-auto px-4 py-6 pb-24 md:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
