'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { User } from '@/types';
import { cn, formatCount, getInitials } from '@/lib/utils';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { BADGE_ICONS } from '@/lib/utils';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

type FollowState = 'none' | 'pending' | 'following';

export function ProfileHeader({ user, isOwnProfile, onEditProfile }: ProfileHeaderProps) {
  const [followState, setFollowState] = useState<FollowState>('none');
  const [menuOpen, setMenuOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(user.followersCount);

  function handleFollow() {
    if (followState === 'none') {
      setFollowState(user.isPrivate ? 'pending' : 'following');
      if (!user.isPrivate) setFollowerCount((c) => c + 1);
    } else if (followState === 'following') {
      setFollowState('none');
      setFollowerCount((c) => c - 1);
    } else {
      // cancel pending
      setFollowState('none');
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(window.location.href);
    setMenuOpen(false);
  }

  const badgeLabel = {
    none: 'Follow',
    pending: 'Pending',
    following: 'Following',
  }[followState];

  const badgeIcon = {
    none: <UserPlus className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    following: <UserCheck className="w-4 h-4" />,
  }[followState];

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative w-full h-[300px] bg-gradient-to-br from-primary/30 to-purple-500/30 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      </div>

      {/* Avatar + Actions row */}
      <div className="relative px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-12 pb-2">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-full ring-4 ring-background overflow-hidden bg-muted shadow-lg">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(user.displayName)}
                </div>
              )}
            </div>
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-1">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                    followState === 'none'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : followState === 'following'
                      ? 'border border-border hover:border-destructive hover:text-destructive hover:bg-destructive/5'
                      : 'border border-border text-muted-foreground'
                  )}
                >
                  {badgeIcon}
                  {badgeLabel}
                </button>

                <Link
                  href={`/messages`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>

                {/* 3-dot menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
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
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-popover border border-border shadow-lg z-20 overflow-hidden"
                      >
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors"
                        >
                          <Ban className="w-4 h-4 text-muted-foreground" />
                          Block @{user.username}
                        </button>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                        <div className="border-t border-border" />
                        <button
                          onClick={handleCopyLink}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-muted-foreground" />
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

        {/* Name + verification */}
        <div className="mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-xl font-bold leading-tight">{user.displayName}</h1>
            <VerificationBadge tier={user.verificationTier} size="md" />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">@{user.username}</p>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-3 text-sm leading-relaxed max-w-lg">{user.bio}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {user.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold">{formatCount(user.postsCount)}</span>
            <span className="text-sm text-muted-foreground">Posts</span>
          </div>
          <Link href={`/profile/${user.username}/followers`} className="flex items-center gap-1.5 hover:underline">
            <span className="text-sm font-bold">{formatCount(followerCount)}</span>
            <span className="text-sm text-muted-foreground">Followers</span>
          </Link>
          <Link href={`/profile/${user.username}/following`} className="flex items-center gap-1.5 hover:underline">
            <span className="text-sm font-bold">{formatCount(user.followingCount)}</span>
            <span className="text-sm text-muted-foreground">Following</span>
          </Link>
        </div>

        {/* Streak */}
        {user.streakDays > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-500">{user.streakDays} day streak</span>
          </div>
        )}

        {/* Badges row */}
        {user.badges.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {user.badges.map((badge) => (
              <div
                key={badge.id}
                title={`${badge.name}: ${badge.description}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium whitespace-nowrap shrink-0 cursor-default"
              >
                <span>{BADGE_ICONS[badge.type] ?? badge.icon}</span>
                {badge.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
