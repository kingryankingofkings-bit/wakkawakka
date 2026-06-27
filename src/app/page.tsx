import Link from 'next/link';
import { Zap, Video, Users, ShoppingBag, BarChart2, MessageCircle, Shield, Globe, Mic, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Wakka</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#creators" className="hover:text-foreground transition-colors">Creators</a>
            <a href="#community" className="hover:text-foreground transition-colors">Community</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-5xl text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Now with Live Streaming & AI Tools
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            The Social Platform
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Built for Creators
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Share your world, grow your audience, and earn from your passion. Wakka combines the best of social media with powerful creator tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95">
              Start for free
            </Link>
            <Link href="/login" className="rounded-full border border-border bg-background px-8 py-3.5 text-base font-semibold hover:bg-muted transition-all active:scale-95">
              Explore the feed →
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required · Free forever plan available</p>
        </div>

        {/* Mock UI preview */}
        <div className="mx-auto mt-20 max-w-4xl px-4">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="h-8 bg-muted/50 flex items-center px-4 gap-2 border-b border-border">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-5 rounded-md bg-muted text-xs flex items-center px-3 text-muted-foreground">wakka.social/feed</div>
            </div>
            <div className="grid grid-cols-[200px_1fr_180px] h-[400px]">
              <div className="border-r border-border p-4 space-y-3">
                {['Feed', 'Explore', 'Reels', 'Live', 'Messages', 'Communities', 'Shop'].map(item => (
                  <div key={item} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${item === 'Feed' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                    <div className="h-3 w-3 rounded bg-current opacity-40" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-4 space-y-4 overflow-hidden">
                <div className="flex gap-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-500 story-ring" />
                      <div className="h-2 w-10 rounded bg-muted" />
                    </div>
                  ))}
                </div>
                {[1,2].map(i => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
                      <div className="space-y-1">
                        <div className="h-2.5 w-24 rounded bg-muted" />
                        <div className="h-2 w-16 rounded bg-muted/60" />
                      </div>
                    </div>
                    <div className="h-32 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20" />
                    <div className="flex gap-4">
                      <div className="h-2 w-12 rounded bg-muted" />
                      <div className="h-2 w-12 rounded bg-muted" />
                      <div className="h-2 w-12 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-l border-border p-4 space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trending</div>
                {['#DigitalArt', '#TechNews', '#Wellness', '#NewMusic', '#AI'].map(tag => (
                  <div key={tag} className="text-sm font-medium text-primary hover:underline cursor-pointer">{tag}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to thrive online</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built for modern creators, communities, and brands.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Video, title: 'Short-Form Reels', desc: 'Full-screen vertical video feed with music integration and AI caption suggestions.', color: 'text-pink-500 bg-pink-500/10' },
              { icon: Zap, title: 'Live Streaming', desc: 'Broadcast live with co-hosting, real-time gifts, and interactive comment feeds.', color: 'text-red-500 bg-red-500/10' },
              { icon: Users, title: 'Communities', desc: 'Create niche micro-communities with specialized moderation and sub-forums.', color: 'text-blue-500 bg-blue-500/10' },
              { icon: ShoppingBag, title: 'Social Commerce', desc: 'Tag products in posts, manage an in-app shop, and checkout without leaving.', color: 'text-green-500 bg-green-500/10' },
              { icon: BarChart2, title: 'Creator Analytics', desc: 'Deep insights on reach, engagement, demographics, and revenue performance.', color: 'text-orange-500 bg-orange-500/10' },
              { icon: MessageCircle, title: 'Rich Messaging', desc: 'Encrypted DMs with group chats, read receipts, and multimedia sharing.', color: 'text-purple-500 bg-purple-500/10' },
              { icon: Mic, title: 'Audio Rooms', desc: 'Drop-in audio spaces for panels, podcasts, and town halls — no scheduling needed.', color: 'text-teal-500 bg-teal-500/10' },
              { icon: Shield, title: 'Privacy First', desc: 'Granular controls, 2FA, data export, and multi-tier verification badges.', color: 'text-yellow-500 bg-yellow-500/10' },
              { icon: Globe, title: 'Fediverse Ready', desc: 'ActivityPub support for cross-platform Fediverse/Mastodon interaction.', color: 'text-indigo-500 bg-indigo-500/10' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section id="creators" className="py-24 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Loved by creators worldwide</h2>
          <p className="text-muted-foreground text-lg mb-16">Join millions building their audience on Wakka.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { num: '10M+', label: 'Monthly Users' },
              { num: '500K+', label: 'Active Creators' },
              { num: '$2M+', label: 'Creator Earnings' },
              { num: '50B+', label: 'Monthly Views' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{num}</div>
                <div className="text-muted-foreground text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { quote: 'Wakka completely replaced my old platform. The analytics are incredible and I went from 2K to 50K followers in 3 months.', name: 'Sarah K.', role: 'Digital Artist' },
              { quote: 'The live streaming tools and virtual gifting let me earn while doing what I love. This is the future of creator monetization.', name: 'Marcus T.', role: 'Music Producer' },
              { quote: 'Communities feature is amazing. My niche audience finally has a home and engagement is through the roof.', name: 'Priya M.', role: 'Wellness Coach' },
            ].map(({ quote, name, role }) => (
              <div key={name} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex mb-3">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-500" />
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to join the next wave?</h2>
          <p className="text-muted-foreground text-lg mb-8">Free to join. Start creating in minutes.</p>
          <Link href="/signup" className="inline-flex rounded-full bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 active:scale-95">
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-background">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Wakka</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {['Privacy', 'Terms', 'Accessibility', 'Help', 'Blog', 'Careers', 'Contact'].map(link => (
              <a key={link} href="#" className="hover:text-foreground transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Wakka. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
