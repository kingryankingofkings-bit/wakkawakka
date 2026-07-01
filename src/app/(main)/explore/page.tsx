"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Users,
  Hash,
  Compass,
  Mic,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCount, cn } from "@/lib/utils";
import {
  MOCK_USERS,
  MOCK_HASHTAGS,
  MOCK_COMMUNITIES,
  MOCK_LIVE_STREAMS,
  MOCK_AUDIO_ROOMS,
} from "@/lib/mockData";
import Link from "next/link";
import { useFeedStore } from "@/store/feedStore";
import { SponsoredAd } from "@/components/ads/SponsoredAd";
import { apiFetch } from "@/lib/apiClient";

const EXPLORE_TABS = [
  "All",
  "People",
  "Posts",
  "Tags",
  "Communities",
  "Live",
  "Audio",
] as const;
type ExploreTab = (typeof EXPLORE_TABS)[number];

interface InterestCategory {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
  readonly tags: readonly string[];
}

const INTEREST_CATEGORIES: readonly InterestCategory[] = [
  { id: "ALL", label: "All Interests", emoji: "🗺️", tags: [] },
  {
    id: "TECH",
    label: "Tech & Dev",
    emoji: "💻",
    tags: ["tech", "setup", "coding", "programming"],
  },
  {
    id: "ART",
    label: "Art & Design",
    emoji: "🎨",
    tags: ["art", "creative", "design", "composition"],
  },
  {
    id: "MUSIC",
    label: "Music & Sound",
    emoji: "🎵",
    tags: ["music", "vibes", "beats"],
  },
  {
    id: "GAMING",
    label: "Gaming",
    emoji: "🎮",
    tags: ["gaming", "setup", "viral"],
  },
  {
    id: "LIFESTYLE",
    label: "Lifestyle",
    emoji: "✨",
    tags: ["lifestyle", "vibes", "travel"],
  },
] as const;

export default function ExplorePage() {
  const { posts, setPosts } = useFeedStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ExploreTab>("All");
  const [interest, setInterest] = useState<string>("ALL");
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(
    new Set(MOCK_COMMUNITIES.filter((c) => c.isMember).map((c) => c.id)),
  );

  const selectedCategory = useMemo(
    () => INTEREST_CATEGORIES.find((c) => c.id === interest),
    [interest],
  );

  // Fetch actual posts from the API on mount
  useEffect(() => {
    let active = true;
    async function loadPosts() {
      try {
        const response = await apiFetch("/api/posts");
        if (response.ok) {
          const json = await response.json();
          if (active && json.data) {
            setPosts(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load posts in ExplorePage:", err);
      }
    }
    loadPosts();
    return () => {
      active = false;
    };
  }, [setPosts]);

  // Filter Users
  const filteredUsers = useMemo(() => {
    let result = MOCK_USERS;
    if (query) {
      result = result.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase()),
      );
    }
    // Filter people loosely based on category (e.g. bio keywords)
    if (interest !== "ALL" && selectedCategory) {
      result = result.filter(
        (u) =>
          u.bio?.toLowerCase().includes(selectedCategory.id.toLowerCase()) ||
          selectedCategory.tags.some((tag) =>
            u.bio?.toLowerCase().includes(tag),
          ),
      );
    }
    return result;
  }, [query, interest, selectedCategory]);

  // Filter Posts
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (query) {
      result = result.filter((p) =>
        p.content.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (interest !== "ALL" && selectedCategory) {
      result = result.filter(
        (p) =>
          selectedCategory.tags.some((tag) =>
            p.content.toLowerCase().includes(`#${tag}`),
          ) ||
          (p.musicTrack && interest === "MUSIC"),
      );
    }
    return result;
  }, [query, interest, selectedCategory, posts]);

  // Filter Tags
  const filteredTags = useMemo(() => {
    let result = MOCK_HASHTAGS;
    if (query) {
      result = result.filter((h) =>
        h.name.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (interest !== "ALL" && selectedCategory) {
      result = result.filter((h) =>
        selectedCategory.tags.includes(h.name.toLowerCase()),
      );
    }
    return result;
  }, [query, interest, selectedCategory]);

  // Filter Communities
  const filteredCommunities = useMemo(() => {
    let result = MOCK_COMMUNITIES;
    if (query) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (interest !== "ALL" && selectedCategory) {
      result = result.filter(
        (c) =>
          c.category
            .toLowerCase()
            .includes(selectedCategory.id.toLowerCase()) ||
          c.description
            .toLowerCase()
            .includes(selectedCategory.id.toLowerCase()) ||
          selectedCategory.tags.some((tag) =>
            c.name.toLowerCase().includes(tag),
          ),
      );
    }
    return result;
  }, [query, interest, selectedCategory]);

  return (
    <div className="min-h-screen">
      {/* Sticky Headers */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 space-y-3">
        {/* Search */}
        <Input
          placeholder="Search Wakka..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Interest Categories Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
          {INTEREST_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setInterest(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border active:scale-95 shadow-sm",
                interest === cat.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {EXPLORE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors",
                tab === t
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Feed Console */}

        {/* People */}
        {(tab === "All" || tab === "People") && filteredUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-base">People</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} padding="md">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${user.username}`}>
                      <Avatar
                        src={user.avatar}
                        name={user.displayName}
                        size="lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-semibold hover:underline block truncate text-foreground text-sm"
                      >
                        {user.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs mt-1 text-foreground line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatCount(user.followersCount)} followers
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={
                        followedUsers.has(user.id) ? "outline" : "primary"
                      }
                      onClick={() =>
                        setFollowedUsers((prev) => {
                          const n = new Set(prev);
                          n.has(user.id) ? n.delete(user.id) : n.add(user.id);
                          return n;
                        })
                      }
                    >
                      {followedUsers.has(user.id) ? "Following" : "Follow"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trending Tags */}
        {(tab === "All" || tab === "Tags") && filteredTags.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-base">Trending Topics</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/feed?search=${tag.name}`}
                  className="rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4 text-primary" />
                    {tag.isTrending && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                        Trending
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-sm text-foreground">
                    #{tag.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCount(tag.postCount)} posts
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Communities */}
        {(tab === "All" || tab === "Communities") &&
          filteredCommunities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base">Communities</h2>
              </div>
              <div className="space-y-3">
                {filteredCommunities.map((c) => (
                  <Card key={c.id} padding="none" className="overflow-hidden">
                    {c.coverImage && (
                      <div className="h-20 bg-gradient-to-r from-primary/30 to-purple-500/30 relative">
                        <img
                          src={c.coverImage}
                          alt={c.name}
                          className="h-full w-full object-cover opacity-60"
                        />
                      </div>
                    )}
                    <div className="p-4 flex items-start gap-3">
                      {c.avatarUrl && (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="h-12 w-12 rounded-xl object-cover flex-shrink-0 -mt-6 ring-2 ring-background bg-card"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/communities`}
                          className="font-semibold hover:underline text-sm text-foreground"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {c.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatCount(c.memberCount)} members · {c.category}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={
                          joinedCommunities.has(c.id) ? "outline" : "primary"
                        }
                        onClick={() =>
                          setJoinedCommunities((prev) => {
                            const n = new Set(prev);
                            n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                            return n;
                          })
                        }
                      >
                        {joinedCommunities.has(c.id) ? "Joined" : "Join"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

        {/* Live */}
        {(tab === "All" || tab === "Live") && MOCK_LIVE_STREAMS.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-bold text-base">Live Now</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_LIVE_STREAMS.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/live?stream=${stream.id}`}
                  className="rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow bg-card"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-red-500/30 to-primary/30">
                    {stream.thumbnailUrl && (
                      <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px]">
                      {formatCount(stream.viewerCount)} watching
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold line-clamp-1 text-foreground">
                      {stream.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar
                        src={stream.host.avatar}
                        name={stream.host.displayName}
                        size="xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {stream.host.displayName}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Audio rooms */}
        {(tab === "All" || tab === "Audio") && MOCK_AUDIO_ROOMS.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-base">Audio Rooms</h2>
            </div>
            <div className="space-y-3">
              {MOCK_AUDIO_ROOMS.map((room) => (
                <Link key={room.id} href={`/audio-rooms?room=${room.id}`}>
                  <Card padding="md" hover>
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-primary/30 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">
                          {room.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {room.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex -space-x-1">
                            {room.speakers.slice(0, 4).map((s) => (
                              <Avatar
                                key={s.id}
                                src={s.avatar}
                                name={s.displayName}
                                size="xs"
                                className="ring-1 ring-background"
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {room.speakers.length} speakers ·{" "}
                            {formatCount(room.listenerCount)} listening
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-bold flex-shrink-0">
                        Live
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts grid */}
        {(tab === "All" || tab === "Posts") && filteredPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-base">Featured Posts</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {filteredPosts
                .filter((p) => p.mediaUrls.length > 0)
                .map((post, i) => (
                  <div key={post.id} className="contents">
                    <Link
                      href={`/feed`}
                      className="aspect-square bg-muted rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={post.mediaUrls[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    {(i + 1) % 5 === 0 && (
                      <div className="col-span-3">
                        <SponsoredAd />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredUsers.length === 0 &&
          filteredPosts.length === 0 &&
          filteredTags.length === 0 &&
          filteredCommunities.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Search className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  No matches found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  No items matched your combination of search query and selected
                  category filters.
                </p>
              </div>
              <button
                onClick={() => {
                  setQuery("");
                  setInterest("ALL");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
