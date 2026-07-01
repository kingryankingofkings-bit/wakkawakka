"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  LinkIcon,
  Flame,
  Calendar,
  MoreHorizontal,
  MessageCircle,
  UserPlus,
  UserCheck,
  Clock,
  Share2,
  Flag,
  Ban,
} from "lucide-react";
import { User } from "@/types";
import { cn, formatCount, getInitials } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { BADGE_ICONS } from "@/lib/utils";
import { ProfileSoundtrack } from "@/components/profile/ProfileSoundtrack";

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

type FollowState = "none" | "pending" | "following";

const PROFILE_THEMES: Record<string, string> = {
  none: "",
  ocean: "bg-gradient-to-br from-blue-900/40 to-teal-900/40",
  sunset: "bg-gradient-to-br from-orange-500/30 to-pink-500/30",
  aurora: "bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-blue-500/30",
  midnight: "bg-black/60 backdrop-blur-3xl",
};

export function ProfileHeader({
  user,
  isOwnProfile,
  onEditProfile,
}: ProfileHeaderProps) {
  const [followState, setFollowState] = useState<FollowState>("none");
  const [menuOpen, setMenuOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(user.followersCount);

  useEffect(() => {
    if (isOwnProfile) return;
    async function checkFollow() {
      try {
        const res = await fetch(`/api/users/${user.id}/follow`);
        if (res.ok) {
          const json = await res.json();
          const status = json.data?.status;
          if (status === "ACCEPTED") setFollowState("following");
          else if (status === "PENDING") setFollowState("pending");
          else setFollowState("none");
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkFollow();
  }, [user.id, isOwnProfile]);

  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isOwnProfile) return;
    async function checkBlock() {
      try {
        const res = await fetch(`/api/users/${user.id}/block`);
        if (res.ok) {
          const json = await res.json();
          setIsBlocked(!!json.data?.blocked);
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkBlock();
  }, [user.id, isOwnProfile]);

  async function handleBlock() {
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/users/${user.id}/block`, {
        method: isBlocked ? "DELETE" : "POST",
      });
      if (res.ok) {
        const json = await res.json();
        const blocked = !!json.data?.blocked;
        setIsBlocked(blocked);
        toast.success(
          blocked ? `Blocked @${user.username}` : `Unblocked @${user.username}`,
        );
        if (blocked) {
          setFollowState("none");
        }
      } else {
        toast.error("Failed to toggle block");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  async function handleFollow() {
    try {
      const res = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        const status = json.data?.status;
        if (status === "ACCEPTED") {
          setFollowState("following");
          setFollowerCount((c) => c + 1);
          toast.success(`You are now following ${user.displayName}`);
        } else if (status === "PENDING") {
          setFollowState("pending");
          toast.success(`Follow request sent to ${user.displayName}`);
        } else {
          setFollowState("none");
          if (followState === "following") {
            setFollowerCount((c) => Math.max(0, c - 1));
          }
          toast.success(`Unfollowed ${user.displayName}`);
        }
      } else {
        const errJson = await res.json();
        toast.error(errJson.error || "Failed to toggle follow");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(window.location.href);
    setMenuOpen(false);
  }

  const badgeLabel = {
    none: "Follow",
    pending: "Pending",
    following: "Following",
  }[followState];

  const badgeIcon = {
    none: <UserPlus className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    following: <UserCheck className="w-4 h-4" />,
  }[followState];

  const themeClasses = user.profileTheme
    ? PROFILE_THEMES[user.profileTheme] || ""
    : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-b-3xl mb-4 shadow-sm",
        themeClasses,
      )}
    >
      {/* Cover Image */}
      <div className="relative w-full h-[320px] bg-gradient-to-br from-primary/30 to-purple-500/30 overflow-hidden">
        {user.coverImage ? (
          <Image
            src={user.coverImage}
            alt={`${user.displayName}'s cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Profile Soundtrack Widget */}
        {user.profileSoundtrack && user.profileSoundtrackVisible !== false && (
          <div className="absolute bottom-6 right-6 z-20">
            <ProfileSoundtrack url={user.profileSoundtrack} />
          </div>
        )}
      </div>

      {/* Avatar + Actions row */}
      <div className="relative px-4 sm:px-8 pb-8 flex flex-col items-center text-center">
        <div className="w-full flex items-end justify-between -mt-16 pb-3 relative">
          {/* Spacer to keep Avatar perfectly centered using flex-1 */}
          <div className="flex-1 hidden sm:block" />

          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative z-10 flex-1 sm:flex-none flex justify-center"
          >
            <div className="w-32 h-32 rounded-full ring-4 ring-background overflow-hidden bg-muted shadow-2xl relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
                  {getInitials(user.displayName)}
                </div>
              )}
            </div>
            {/* Online dot */}
            <span className="absolute bottom-2 right-2 sm:-mr-2 w-5 h-5 rounded-full bg-green-500 border-4 border-background shadow-sm" />
          </motion.div>

          {/* Action buttons */}
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2 mb-2 relative z-10">
              {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="px-5 py-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-sm font-bold hover:bg-muted transition-colors shadow-sm"
              >
                Customize Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={cn(
                    "flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm",
                    followState === "none"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : followState === "following"
                        ? "bg-background/80 backdrop-blur-md border border-border hover:border-destructive hover:text-destructive"
                        : "bg-background/80 backdrop-blur-md border border-border text-muted-foreground",
                  )}
                >
                  {badgeIcon}
                  {badgeLabel}
                </button>

                <Link
                  href={`/messages`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-sm font-bold hover:bg-muted transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                </Link>

                {/* 3-dot menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border hover:bg-muted transition-colors shadow-sm"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-popover border border-border shadow-xl z-20 overflow-hidden"
                      >
                        <button
                          onClick={handleBlock}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <Ban className="w-4 h-4 text-muted-foreground" />{" "}
                          {isBlocked ? "Unblock" : "Block"} @{user.username}
                        </button>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Flag className="w-4 h-4" /> Report
                        </button>
                        <div className="border-t border-border" />
                        <button
                          onClick={handleCopyLink}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-muted-foreground" />{" "}
                          Copy link
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Name + verification */}
        <div className="mt-2 relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              {user.displayName}
            </h1>
            <VerificationBadge tier={user.verificationTier} size="lg" />
          </div>
          <p className="text-muted-foreground font-medium mt-0.5">
            @{user.username}
          </p>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-[15px] leading-relaxed max-w-2xl text-foreground/90 relative z-10 text-center">
            {user.bio}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 mt-4 text-sm font-medium text-muted-foreground relative z-10">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <LinkIcon className="w-4 h-4" />
              {user.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex justify-center items-center gap-6 mt-5 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black">
              {formatCount(user.postsCount)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Posts
            </span>
          </div>
          {(!user.hideFollowerCount || isOwnProfile) && (
            <Link
              href={`/profile/${user.username}/followers`}
              className="flex items-center gap-1.5 hover:underline"
            >
              <span className="text-base font-black">
                {formatCount(followerCount)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Followers
              </span>
            </Link>
          )}
          <Link
            href={`/profile/${user.username}/following`}
            className="flex items-center gap-1.5 hover:underline"
          >
            <span className="text-base font-black">
              {formatCount(user.followingCount)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Following
            </span>
          </Link>
        </div>

        {/* Badges row */}
        {user.badges && user.badges.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-5 overflow-x-auto no-scrollbar pb-1 relative z-10 w-full">
            {user.badges.map((badge) => (
              <div
                key={badge.id}
                title={`${badge.name}: ${badge.description}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-border shadow-sm text-xs font-bold whitespace-nowrap shrink-0"
              >
                <span>{BADGE_ICONS[badge.type] ?? badge.icon}</span>
                {badge.name}
              </div>
            ))}
            {user.streakDays > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold whitespace-nowrap shrink-0 text-orange-500">
                <Flame className="w-3.5 h-3.5" />
                {user.streakDays} day streak
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
