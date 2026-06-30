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
}

interface FeedActions {
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
  setFeedType: (type: FeedType) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
}

type FeedStore = FeedState & FeedActions;

export const useFeedStore = create<FeedStore>((set) => ({
  // Initial state
  posts: MOCK_POSTS,
  feedType: "forYou",
  isLoading: false,
  hasMore: true,

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
}));
