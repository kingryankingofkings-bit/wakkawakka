"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Grid3X3,
  Film,
  Tag,
  Heart,
  Users,
  Library,
  Folder,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pin,
  Briefcase,
} from "lucide-react";
import Image from "next/image";
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ProfileCustomizerModal } from "@/components/profile/ProfileCustomizerModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { ProfessionalTab } from "@/components/profile/ProfessionalTab";

const PROFILE_TABS = [
  { id: "posts", label: "Posts", icon: Grid3X3 },
  { id: "albums", label: "Albums", icon: Library },
  { id: "reels", label: "Reels", icon: Film },
  { id: "tagged", label: "Tagged", icon: Tag },
  { id: "liked", label: "Liked", icon: Heart },
  { id: "communities", label: "Communities", icon: Users },
  { id: "professional", label: "Professional", icon: Briefcase },
] as const;

type TabId = (typeof PROFILE_TABS)[number]["id"];

interface ProfilePageProps {
  params: { username: string };
}

interface Album {
  id: string;
  title: string;
  photos: string[];
}

const DEFAULT_ALBUMS: Album[] = [
  {
    id: "1",
    title: "Summer Trip 🏝️",
    photos: [
      "https://picsum.photos/seed/summer1/800/800",
      "https://picsum.photos/seed/summer2/800/800",
      "https://picsum.photos/seed/summer3/800/800",
    ],
  },
  {
    id: "2",
    title: "Design Setup 💻",
    photos: [
      "https://picsum.photos/seed/desk1/800/800",
      "https://picsum.photos/seed/desk2/800/800",
    ],
  },
  {
    id: "3",
    title: "Vibes ✨",
    photos: [
      "https://picsum.photos/seed/vibe1/800/800",
      "https://picsum.photos/seed/vibe2/800/800",
      "https://picsum.photos/seed/vibe3/800/800",
      "https://picsum.photos/seed/vibe4/800/800",
    ],
  },
];

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const authUser = useAuthStore((s) => s.activeProfile);
  const currentUser = authUser ?? CURRENT_USER;

  const baseProfileUser =
    currentUser.username === username
      ? currentUser
      : (MOCK_USERS.find((u) => u.username === username) ?? MOCK_USERS[0]);

  const userPosts = MOCK_POSTS.filter((p) => p.authorId === baseProfileUser.id);
  const profileUser = {
    ...baseProfileUser,
    postsCount: userPosts.length,
  };

  const isOwnProfile = profileUser.username === currentUser.username;
  // Fallback to checking a generic following array or default to true for demo purposes if it's the 2nd mock user
  const isFollowing =
    (currentUser as any).following?.includes(profileUser.id) ||
    profileUser.id === "u2";

  const orderedTabs = profileUser.profileTabOrder
    ? (profileUser.profileTabOrder
        .map((id) => PROFILE_TABS.find((t) => t.id === id))
        .filter(Boolean) as (typeof PROFILE_TABS)[number][])
    : PROFILE_TABS;

  const [activeTab, setActiveTab] = useState<TabId>(
    orderedTabs[0]?.id || "posts",
  );
  const [editOpen, setEditOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Albums State
  const [albums, setAlbums] = useState<Album[]>(DEFAULT_ALBUMS);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const isPrivateLocked =
    profileUser.isPrivate && !isOwnProfile && !isFollowing;

  // Find all post images user could select from
  const selectablePostImages = userPosts
    .filter((p) => p.mediaUrls.length > 0)
    .flatMap((p) => p.mediaUrls);

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) {
      toast.error("Please enter an album title");
      return;
    }
    if (selectedPhotos.length === 0) {
      toast.error("Please select at least 1 photo for your album");
      return;
    }

    const newAlbum: Album = {
      id: Date.now().toString(),
      title: newAlbumTitle,
      photos: [...selectedPhotos],
    };

    setAlbums((prev) => [newAlbum, ...prev]);
    setCreateAlbumOpen(false);
    setNewAlbumTitle("");
    setSelectedPhotos([]);
    toast.success(`Album "${newAlbum.title}" created successfully!`);
  };

  const toggleSelectPhoto = (url: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(url) ? prev.filter((x) => x !== url) : [...prev, url],
    );
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAlbum) return;
    setActivePhotoIndex((prev) =>
      prev === 0 ? activeAlbum.photos.length - 1 : prev - 1,
    );
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAlbum) return;
    setActivePhotoIndex((prev) =>
      prev === activeAlbum.photos.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      {profileUser.customCss && (
        <style dangerouslySetInnerHTML={{ __html: profileUser.customCss.replace(/</g, "") }} />
      )}
      
      {/* Profile Customizer Modal */}
      {customizerOpen && isOwnProfile && (
        <ProfileCustomizerModal
          activeProfile={profileUser}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
      
      {profileUser.profileSoundtrack && profileUser.profileSoundtrackVisible !== false && (
        <div className="fixed bottom-20 right-4 z-50 bg-background/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border flex flex-col gap-2 w-64">
          <p className="text-xs font-bold truncate">Now Playing</p>
          <audio 
            controls 
            autoPlay 
            className="w-full h-8" 
            src={profileUser.profileSoundtrack.includes('|') ? profileUser.profileSoundtrack.split('|')[1].trim() : profileUser.profileSoundtrack} 
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto min-h-screen">
        {/* Profile Header */}
        <ProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setCustomizerOpen(true)}
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
            <h3 className="text-lg font-semibold mb-2">
              This account is private
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Follow @{profileUser.username} to see their photos, reels, and
              posts.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="sticky top-0 z-10 mt-4 bg-background/80 backdrop-blur-sm border-b border-border">
              <div className="flex overflow-x-auto no-scrollbar">
                {orderedTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
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
                {activeTab === "posts" && (
                  <PostsGrid
                    posts={userPosts}
                    pinnedPostId={profileUser.pinnedPostId}
                  />
                )}

                {activeTab === "professional" && (
                  <ProfessionalTab
                    profileUserId={profileUser.id}
                    isOwnProfile={isOwnProfile}
                  />
                )}

                {activeTab === "albums" && (
                  <div className="p-4 space-y-4">
                    {isOwnProfile && (
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-foreground">
                          Photo Collections
                        </h3>
                        <Button
                          size="xs"
                          onClick={() => {
                            if (selectablePostImages.length === 0) {
                              toast.error(
                                "You don't have any uploaded post images to organize into albums!",
                              );
                              return;
                            }
                            setCreateAlbumOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New Album
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {albums.map((album) => (
                        <div
                          key={album.id}
                          onClick={() => {
                            setActiveAlbum(album);
                            setActivePhotoIndex(0);
                          }}
                          className="group relative cursor-pointer overflow-hidden border border-border bg-card rounded-2xl p-2 hover:shadow-md transition-shadow"
                        >
                          {/* Quad layout or single cover image */}
                          <div className="aspect-[4/3] w-full bg-muted rounded-xl overflow-hidden relative">
                            {album.photos[0] && (
                              <img
                                src={album.photos[0]}
                                alt={album.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2.5">
                              <span className="text-[10px] text-white font-bold bg-black/40 px-2 py-0.5 rounded-full">
                                {album.photos.length} photos
                              </span>
                            </div>
                          </div>
                          <div className="p-2 flex items-center gap-2">
                            <Folder className="h-4 w-4 text-primary shrink-0" />
                            <p className="font-bold text-xs truncate text-foreground">
                              {album.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "reels" && (
                  <EmptyTab
                    label="No Reels yet"
                    description="Reels will appear here"
                    icon={Film}
                  />
                )}
                {activeTab === "tagged" && (
                  <EmptyTab
                    label="No tagged posts"
                    description="Posts you're tagged in will appear here"
                    icon={Tag}
                  />
                )}
                {activeTab === "liked" && (
                  <EmptyTab
                    label="No liked posts"
                    description="Posts you've liked will appear here"
                    icon={Heart}
                  />
                )}
                {activeTab === "communities" && (
                  <EmptyTab
                    label="No communities yet"
                    description="Communities will appear here"
                    icon={Users}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <EditProfileModal
          activeProfile={profileUser}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Album Creation Modal */}
      <Modal
        isOpen={createAlbumOpen}
        onClose={() => setCreateAlbumOpen(false)}
        title="Create New Photo Album"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-4 p-1">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              Album Title
            </label>
            <Input
              required
              placeholder="e.g. Summer Vacation 🏖️"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground block">
              Select Photos ({selectedPhotos.length} selected)
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto border border-border/80 rounded-2xl p-2 bg-muted/10">
              {selectablePostImages.map((url, idx) => {
                const isSelected = selectedPhotos.includes(url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectPhoto(url)}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all",
                      isSelected
                        ? "border-primary scale-[0.95]"
                        : "border-transparent",
                    )}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setCreateAlbumOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Album</Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Album Carousel Modal */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={() => setActiveAlbum(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors z-55"
            aria-label="Close Lightbox"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Album Title */}
          <div className="absolute top-4 left-6 text-white space-y-0.5">
            <h4 className="font-extrabold text-sm">{activeAlbum.title}</h4>
            <p className="text-[10px] text-white/60">
              Photo {activePhotoIndex + 1} of {activeAlbum.photos.length}
            </p>
          </div>

          {/* Carousel Body */}
          <div className="relative w-full max-w-xl aspect-square flex items-center justify-center">
            {/* Left navigation arrow */}
            {activeAlbum.photos.length > 1 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Current photo */}
            <div className="relative w-full h-full max-h-[75vh] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activePhotoIndex}
                  src={activeAlbum.photos[activePhotoIndex]}
                  alt=""
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                />
              </AnimatePresence>
            </div>

            {/* Right navigation arrow */}
            {activeAlbum.photos.length > 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PostsGrid({
  posts,
  pinnedPostId,
}: {
  posts: typeof MOCK_POSTS;
  pinnedPostId?: string;
}) {
  if (posts.length === 0) {
    return (
      <EmptyTab
        label="No posts yet"
        description="Posts will appear here when shared"
        icon={Grid3X3}
      />
    );
  }

  const pinnedPost = pinnedPostId
    ? posts.find((p) => p.id === pinnedPostId)
    : null;
  const standardPosts = pinnedPost
    ? posts.filter((p) => p.id !== pinnedPostId)
    : posts;

  const imagePosts = standardPosts.filter((p) => p.mediaUrls.length > 0);
  const textPosts = standardPosts.filter((p) => p.mediaUrls.length === 0);

  return (
    <div className="mt-2 pb-8">
      {/* Pinned Post Section */}
      {pinnedPost && (
        <div className="mb-4 px-4 sm:px-0">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider px-2">
            <Pin className="w-3.5 h-3.5 fill-primary" /> Pinned Post
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-1 overflow-hidden"
          >
            {pinnedPost.mediaUrls.length > 0 ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden cursor-pointer group">
                <Image
                  src={pinnedPost.mediaUrls[0]}
                  alt="Pinned"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-medium line-clamp-2">
                    {pinnedPost.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-card rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <p className="text-sm font-medium leading-relaxed text-foreground">
                  {pinnedPost.content}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

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
              <p className="text-sm leading-relaxed line-clamp-3 text-foreground">
                {post.content}
              </p>
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
      <h3 className="text-base font-semibold mb-1 text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
