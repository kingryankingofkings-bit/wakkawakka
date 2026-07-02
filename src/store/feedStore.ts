"use client";

import { create } from "zustand";
import { Post } from "@/types";
import { MOCK_POSTS } from "@/lib/mockData";

export type FeedType = "forYou" | "following" | "trending";

interface FeedState {
  posts: Post[];
  feedType: FeedType;
  isLoading: boolean;
  hasMore: boolean;
  beRealLocked: boolean;
  beRealPosted: boolean;
}

interface FeedActions {
  setPosts: (_posts: Post[]) => void;
  addPost: (_post: Post) => void;
  updatePost: (_id: string, _updates: Partial<Post>) => void;
  removePost: (_id: string) => void;
  setFeedType: (_type: FeedType) => void;
  setLoading: (_loading: boolean) => void;
  setHasMore: (_hasMore: boolean) => void;
  setDailySnapLocked: (_locked: boolean) => void;
  setDailySnapPosted: (_posted: boolean) => void;
  unlockDailySnapFeed: () => void;
}

type FeedStore = FeedState & FeedActions;

export const useFeedStore = create<FeedStore>((set) => ({
  // Initial state
  posts: MOCK_POSTS,
  feedType: "forYou",
  isLoading: false,
  hasMore: true,
  beRealLocked: true,
  beRealPosted: false,

  // Actions
  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  setFeedType: (feedType) => set({ feedType }),

  setLoading: (isLoading) => set({ isLoading }),

  setHasMore: (hasMore) => set({ hasMore }),

  setDailySnapLocked: (beRealLocked) => set({ beRealLocked }),

  setDailySnapPosted: (posted) => set({ beRealPosted: posted, beRealLocked: !posted }),

  unlockDailySnapFeed: () => set({ beRealLocked: false, beRealPosted: true }),
}));
