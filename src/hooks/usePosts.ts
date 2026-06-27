'use client';

import { useState, useCallback } from 'react';
import { Post, ReactionType } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import toast from 'react-hot-toast';

export function usePosts() {
  const { posts, updatePost, removePost } = useFeedStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactToPost = useCallback(async (postId: string, reaction: ReactionType) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasReacted = post.userReaction === reaction;
    updatePost(postId, {
      userReaction: wasReacted ? undefined : reaction,
      likesCount: wasReacted ? post.likesCount - 1 : post.likesCount + 1,
    });
  }, [posts, updatePost]);

  const bookmarkPost = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    updatePost(postId, { isBookmarked: !post.isBookmarked });
    toast.success(post.isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  }, [posts, updatePost]);

  const deletePost = useCallback((postId: string) => {
    removePost(postId);
    toast.success('Post deleted');
  }, [removePost]);

  const sharePost = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast.success('Link copied!');
      updatePost(postId, { sharesCount: post.sharesCount + 1 });
    } catch {
      toast.error('Could not copy link');
    }
  }, [posts, updatePost]);

  return { posts, reactToPost, bookmarkPost, deletePost, sharePost, isSubmitting };
}
