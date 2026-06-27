'use client';

import { useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Grid3X3, Film, Tag, Heart, Users } from 'lucide-react';
import Image from 'next/image';
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { useAuthStore } from '@/store/authStore';

const PROFILE_TABS = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'reels', label: 'Reels', icon: Film },
  { id: 'tagged', label: 'Tagged', icon: Tag },
  { id: 'liked', label: 'Liked', icon: Heart },
  { id: 'communities', label: 'Communities', icon: Users },
] as const;

type TabId = (typeof PROFILE_TABS)[number]['id'];

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = use(params);
  const authUser = useAuthStore((s) => s.user);
  const currentUser = authUser ?? CURRENT_USER;

  const profileUser =
    MOCK_USERS.find((u) => u.username === username) ?? MOCK_USERS[0];

  const isOwnProfile = profileUser.username === currentUser.username;
  const isFollowing = false; // Would come from state/API in production

  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [editOpen, setEditOpen] = useState(false);

  const userPosts = MOCK_POSTS.filter((p) => p.authorId === profileUser.id);

  const isPrivateLocked = profileUser.isPrivate && !isOwnProfile && !isFollowing;

  return (
    <>
      <div className="max-w-2xl mx-auto min-h-screen">
        {/* Profile Header */}
        <ProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setEditOpen(true)}
        />

        {/* Private account lock screen */}
        {isPrivateLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">This account is private</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Follow @{profileUser.username} to see their photos, reels, and posts.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="sticky top-0 z-10 mt-4 bg-background/80 backdrop-blur-sm border-b border-border">
              <div className="flex overflow-x-auto no-scrollbar">
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'posts' && (
                  <PostsGrid posts={userPosts} />
                )}
                {activeTab === 'reels' && (
                  <EmptyTab label="No Reels yet" description="Reels will appear here" icon={Film} />
                )}
                {activeTab === 'tagged' && (
                  <EmptyTab label="No tagged posts" description="Posts you're tagged in will appear here" icon={Tag} />
                )}
                {activeTab === 'liked' && (
                  <EmptyTab label="No liked posts" description="Posts you've liked will appear here" icon={Heart} />
                )}
                {activeTab === 'communities' && (
                  <EmptyTab label="No communities yet" description="Communities will appear here" icon={Users} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <EditProfileModal user={profileUser} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}

function PostsGrid({ posts }: { posts: typeof MOCK_POSTS }) {
  if (posts.length === 0) {
    return (
      <EmptyTab label="No posts yet" description="Posts will appear here when shared" icon={Grid3X3} />
    );
  }

  const imagePosts = posts.filter((p) => p.mediaUrls.length > 0);
  const textPosts = posts.filter((p) => p.mediaUrls.length === 0);

  return (
    <div className="mt-2 pb-8">
      {/* Image grid */}
      {imagePosts.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5">
          {imagePosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-square overflow-hidden bg-muted group cursor-pointer"
            >
              <Image
                src={post.mediaUrls[0]}
                alt={post.content.slice(0, 40)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {post.mediaUrls.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-white text-xs font-medium">
                  +{post.mediaUrls.length - 1}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Text posts */}
      {textPosts.length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {textPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
            >
              <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>❤️ {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
                <span>🔁 {post.sharesCount}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyTab({
  label,
  description,
  icon: Icon,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
