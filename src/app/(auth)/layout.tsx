import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | Wakka',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel — branding / hero (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary/90 via-purple-600 to-pink-600 flex-col items-center justify-center p-12 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full bg-pink-300/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-md text-center space-y-6">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-2 group">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black shadow-lg group-hover:scale-105 transition-transform">
              W
            </div>
            <span className="text-3xl font-black tracking-tight">Wakka</span>
          </Link>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Connect. Create.
            <br />
            <span className="text-white/80">Inspire.</span>
          </h1>

          <p className="text-lg text-white/75 leading-relaxed">
            Join millions of creators sharing their stories, art, music, and passion on the
            platform built for the next generation.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {[
              '🎬 Reels',
              '🔴 Live',
              '🛍️ Shop',
              '🎵 Music',
              '🤝 Communities',
              '📊 Analytics',
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium text-white/90 border border-white/20"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 justify-center pt-4">
            <div className="flex -space-x-2">
              {['alex', 'sam', 'maya', 'jordan'].map((seed) => (
                <img
                  key={seed}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  alt={seed}
                  className="w-8 h-8 rounded-full border-2 border-white/50 bg-white/20"
                />
              ))}
            </div>
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">2.4M+</span> creators already here
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
            W
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground">Wakka</span>
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
