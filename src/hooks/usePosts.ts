'use client';

import { useState, useCallback } from 'react';
import { Post, ReactionType } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/apiClient';

export function usePosts() {
  const { posts, updatePost, removePost } = useFeedStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactToPost = useCallback(async (postId: string, reaction: ReactionType) => {
    try {
      const response = await apiFetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        body: JSON.stringify({ type: reaction }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          updatePost(postId, {
            userReaction: json.data.userReaction,
            likesCount: json.data.likesCount,
          });
        }
      } else {
        toast.error('Failed to react to post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to react to post');
    }
  }, [updatePost]);

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
