"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";

// =============================================================================
// Interfaces & Types
// =============================================================================

export interface Subforum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  creatorId: string;
  rules?: string; // JSON string array
  memberCount: number;
  postCount: number;
  customTheme?: string; // JSON string
  isNSFW: boolean;
  isSpoiler: boolean;
  createdAt: string;
}

export interface SubforumMember {
  id: string;
  subforumId: string;
  userId: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  flair?: string;
  joinedAt: string;
  isBanned: boolean;
  isMuted: boolean;
}

export interface SubforumPost {
  id: string;
  title: string;
  content?: string;
  type: "TEXT" | "POLL" | "LINK" | "MEDIA";
  mediaUrls: string[]; // JSON array of strings in DB
  pollOptions?: string[]; // JSON array of strings
  pollVotes?: Record<string, number>; // JSON map: { option: count }
  upvotes: number;
  downvotes: number;
  score: number;
  authorId: string;
  author?: { id: string; username: string; displayName?: string; avatarUrl?: string };
  subforumId: string;
  subforum?: { id: string; name: string; slug: string };
  isSpoiler: boolean;
  isNSFW: boolean;
  isLocked: boolean;
  isPinned: boolean;
  isAMA: boolean;
  karmaValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubforumComment {
  id: string;
  content: string;
  authorId: string;
  author?: { id: string; username: string; displayName?: string; avatarUrl?: string };
  postId: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  isDeleted: boolean;
  isAMAAnswer: boolean;
  replies?: SubforumComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumVote {
  id: string;
  userId: string;
  targetId: string;
  type: "UPVOTE" | "DOWNVOTE";
  targetType: "POST" | "COMMENT";
  createdAt: string;
}

export interface ForumAward {
  id: string;
  name: string;
  icon: string;
  price: number;
  senderId: string;
  receiverId: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  createdAt: string;
}

export interface ForumModAction {
  id: string;
  subforumId: string;
  moderatorId: string;
  action: "LOCK_POST" | "REMOVE_POST" | "REMOVE_COMMENT" | "BAN_USER" | "MUTE_USER";
  targetUserId?: string;
  targetPostId?: string;
  targetCommentId?: string;
  reason?: string;
  createdAt: string;
}

interface ForumState {
  subforums: Subforum[];
  activeSubforum: Subforum | null;
  activeSubforumMembers: SubforumMember[];
  posts: SubforumPost[];
  activePost: SubforumPost | null;
  comments: SubforumComment[];
  activePostVotes: Record<string, "UPVOTE" | "DOWNVOTE" | null>;
  activeCommentVotes: Record<string, "UPVOTE" | "DOWNVOTE" | null>;
  loading: boolean;
  error: string | null;
  socket: any | null;
}

interface ForumActions {
  fetchSubforums: (_query?: string) => Promise<void>;
  fetchSubforumByName: (_nameOrSlug: string) => Promise<Subforum | null>;
  createSubforum: (_data: { name: string; description?: string; rules?: string[]; customTheme?: any; isNSFW?: boolean; isSpoiler?: boolean }) => Promise<Subforum>;
  joinSubforum: (_subforumId: string) => Promise<void>;
  leaveSubforum: (_subforumId: string) => Promise<void>;
  setSocket: (_socket: any) => void;
  
  fetchPosts: (_filters?: { subforumId?: string; sort?: string; query?: string }) => Promise<void>;
  fetchPostById: (_id: string) => Promise<SubforumPost | null>;
  createPost: (_data: { title: string; content?: string; type: string; mediaUrls?: string[]; pollOptions?: string[]; isSpoiler?: boolean; isNSFW?: boolean; isAMA?: boolean; subforumId: string }) => Promise<SubforumPost>;
  crosspost: (_postId: string, _targetSubforumId: string) => Promise<SubforumPost>;
  toggleAMA: (_postId: string, _isAMA: boolean) => Promise<void>;
  votePost: (_postId: string, _type: "UPVOTE" | "DOWNVOTE" | null) => Promise<void>;
  voteComment: (_commentId: string, _type: "UPVOTE" | "DOWNVOTE" | null) => Promise<void>;
  giveAward: (_postIdOrCommentId: string, _targetType: "POST" | "COMMENT", _data: { name: string; price: number; icon: string }) => Promise<void>;
  
  fetchComments: (_postId: string) => Promise<void>;
  createComment: (_postId: string, _content: string, _parentId?: string) => Promise<SubforumComment>;
  
  moderatePost: (_postId: string, _action: "LOCK_POST" | "REMOVE_POST", _reason?: string, _subforumId?: string) => Promise<void>;
  moderateComment: (_commentId: string, _action: "REMOVE_COMMENT", _reason?: string, _subforumId?: string) => Promise<void>;
  moderateUser: (_subforumId: string, _targetUserId: string, _action: "BAN_USER" | "MUTE_USER", _reason?: string) => Promise<void>;
  
  // Local real-time setters
  addCommentLocal: (_comment: SubforumComment) => void;
  updatePostScoreLocal: (_postId: string, _upvotes: number, _downvotes: number, _score: number) => void;
  updateCommentScoreLocal: (_commentId: string, _upvotes: number, _downvotes: number, _score: number) => void;
  addAwardLocal: (_award: ForumAward) => void;
  applyModActionLocal: (_action: any) => void;
  clearActiveData: () => void;
}

export const useForumStore = create<ForumState & ForumActions>((set, get) => ({
  subforums: [],
  activeSubforum: null,
  activeSubforumMembers: [],
  posts: [],
  activePost: null,
  comments: [],
  activePostVotes: {},
  activeCommentVotes: {},
  loading: false,
  error: null,
  socket: null,

  setSocket: (socket) => set({ socket }),

  clearActiveData: () => set({ activePost: null, comments: [], activePostVotes: {}, activeCommentVotes: {} }),

  fetchSubforums: async (query) => {
    set({ loading: true, error: null });
    try {
      const url = query ? `/api/forum/subforums?query=${encodeURIComponent(query)}` : `/api/forum/subforums`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch subforums");
      set({ subforums: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSubforumByName: async (nameOrSlug) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch(`/api/forum/subforums/${nameOrSlug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subforum not found");
      set({
        activeSubforum: data.data,
        activeSubforumMembers: data.members || [],
        loading: false,
      });
      return data.data;
    } catch (err: any) {
      set({ error: err.message, loading: false, activeSubforum: null });
      return null;
    }
  },

  createSubforum: async (subforumData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch(`/api/forum/subforums`, {
        method: "POST",
        body: JSON.stringify(subforumData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create subforum");
      set((state) => ({
        subforums: [data.data, ...state.subforums],
        loading: false,
      }));
      return data.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  joinSubforum: async (subforumId) => {
    try {
      const res = await apiFetch(`/api/forum/subforums/${subforumId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join subforum");
      
      // Update activeSubforum memberCount locally
      set((state) => {
        if (state.activeSubforum && state.activeSubforum.id === subforumId) {
          return {
            activeSubforum: {
              ...state.activeSubforum,
              memberCount: state.activeSubforum.memberCount + 1,
            },
          };
        }
        return {};
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  leaveSubforum: async (subforumId) => {
    try {
      const res = await apiFetch(`/api/forum/subforums/${subforumId}/join`, {
        method: "POST",
        body: JSON.stringify({ leave: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave subforum");
      
      // Update activeSubforum memberCount locally
      set((state) => {
        if (state.activeSubforum && state.activeSubforum.id === subforumId) {
          return {
            activeSubforum: {
              ...state.activeSubforum,
              memberCount: Math.max(0, state.activeSubforum.memberCount - 1),
            },
          };
        }
        return {};
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchPosts: async (filters) => {
    set({ loading: true, error: null });
    try {
      let url = `/api/forum/posts`;
      const params = new URLSearchParams();
      if (filters?.subforumId) params.append("subforumId", filters.subforumId);
      if (filters?.sort) params.append("sort", filters.sort);
      if (filters?.query) params.append("query", filters.query);
      
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;
      
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
      set({ posts: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPostById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch(`/api/forum/posts/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch post");
      
      const commentsRes = await apiFetch(`/api/forum/posts/${id}/comments`);
      const commentsData = await commentsRes.json();
      
      set({
        activePost: data.data,
        comments: commentsData.data || [],
        activePostVotes: { ...get().activePostVotes, [id]: data.userVote },
        loading: false,
      });
      
      return data.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createPost: async (postData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch(`/api/forum/posts`, {
        method: "POST",
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      set((state) => ({
        posts: [data.data, ...state.posts],
        loading: false,
      }));
      return data.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  crosspost: async (postId, targetSubforumId) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch(`/api/forum/posts/${postId}/crosspost`, {
        method: "POST",
        body: JSON.stringify({ targetSubforumId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to crosspost");
      set((state) => ({
        posts: [data.data, ...state.posts],
        loading: false,
      }));
      return data.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  toggleAMA: async (postId, isAMA) => {
    try {
      const res = await apiFetch(`/api/forum/posts/${postId}/ama`, {
        method: "POST",
        body: JSON.stringify({ isAMA }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update AMA status");
      set((state) => {
        if (state.activePost && state.activePost.id === postId) {
          return { activePost: { ...state.activePost, isAMA } };
        }
        return {};
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  votePost: async (postId, type) => {
    // Optimistic update
    const previousVote = get().activePostVotes[postId] || null;
    set((state) => {
      const posts = state.posts.map((p) => {
        if (p.id === postId) {
          let scoreDiff = 0;
          let upvoteDiff = 0;
          let downvoteDiff = 0;
          
          if (type === "UPVOTE") {
            upvoteDiff = 1;
            if (previousVote === "DOWNVOTE") {
              downvoteDiff = -1;
              scoreDiff = 2;
            } else {
              scoreDiff = 1;
            }
          } else if (type === "DOWNVOTE") {
            downvoteDiff = 1;
            if (previousVote === "UPVOTE") {
              upvoteDiff = -1;
              scoreDiff = -2;
            } else {
              scoreDiff = -1;
            }
          } else { // clearing vote
            if (previousVote === "UPVOTE") {
              upvoteDiff = -1;
              scoreDiff = -1;
            } else if (previousVote === "DOWNVOTE") {
              downvoteDiff = -1;
              scoreDiff = 1;
            }
          }
          return {
            ...p,
            upvotes: p.upvotes + upvoteDiff,
            downvotes: p.downvotes + downvoteDiff,
            score: p.score + scoreDiff,
          };
        }
        return p;
      });

      const activePost = state.activePost?.id === postId ? posts.find(p => p.id === postId) || state.activePost : state.activePost;

      return {
        posts,
        activePost,
        activePostVotes: { ...state.activePostVotes, [postId]: type },
      };
    });

    try {
      const res = await apiFetch(`/api/forum/posts/${postId}/vote`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      const json = await res.json();
      const socket = get().socket;
      if (socket && json.data) {
        const { score, upvotes, downvotes, userKarma } = json.data;
        socket.emit("forum-new-vote", {
          targetId: postId,
          targetType: "POST",
          score,
          upvotes,
          downvotes,
          userKarma,
        });
      }
    } catch (err: any) {
      // Revert optimistic update
      set((state) => ({
        activePostVotes: { ...state.activePostVotes, [postId]: previousVote },
      }));
    }
  },

  voteComment: async (commentId, type) => {
    const previousVote = get().activeCommentVotes[commentId] || null;
    
    // Renders update helper recursively
    const updateCommentInTree = (items: SubforumComment[]): SubforumComment[] => {
      return items.map((c) => {
        if (c.id === commentId) {
          let scoreDiff = 0;
          let upvoteDiff = 0;
          let downvoteDiff = 0;
          
          if (type === "UPVOTE") {
            upvoteDiff = 1;
            if (previousVote === "DOWNVOTE") {
              downvoteDiff = -1;
              scoreDiff = 2;
            } else {
              scoreDiff = 1;
            }
          } else if (type === "DOWNVOTE") {
            downvoteDiff = 1;
            if (previousVote === "UPVOTE") {
              upvoteDiff = -1;
              scoreDiff = -2;
            } else {
              scoreDiff = -1;
            }
          } else {
            if (previousVote === "UPVOTE") {
              upvoteDiff = -1;
              scoreDiff = -1;
            } else if (previousVote === "DOWNVOTE") {
              downvoteDiff = -1;
              scoreDiff = 1;
            }
          }
          return {
            ...c,
            upvotes: c.upvotes + upvoteDiff,
            downvotes: c.downvotes + downvoteDiff,
            score: c.score + scoreDiff,
          };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateCommentInTree(c.replies) };
        }
        return c;
      });
    };

    set((state) => ({
      comments: updateCommentInTree(state.comments),
      activeCommentVotes: { ...state.activeCommentVotes, [commentId]: type },
    }));

    try {
      const res = await apiFetch(`/api/forum/comments/${commentId}/vote`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to vote comment");
      const json = await res.json();
      const socket = get().socket;
      if (socket && json.data) {
        const { score, upvotes, downvotes, userKarma } = json.data;
        socket.emit("forum-new-vote", {
          targetId: commentId,
          targetType: "COMMENT",
          score,
          upvotes,
          downvotes,
          userKarma,
        });
      }
    } catch (err: any) {
      // Revert
      set((state) => {
        const revertTree = (items: SubforumComment[]): SubforumComment[] => {
          return items.map((c) => {
            if (c.id === commentId) {
              let scoreDiff = 0;
              let upvoteDiff = 0;
              let downvoteDiff = 0;
              
              if (previousVote === "UPVOTE") {
                upvoteDiff = 1;
                if (type === "DOWNVOTE") {
                  downvoteDiff = -1;
                  scoreDiff = 2;
                } else {
                  scoreDiff = 1;
                }
              } else if (previousVote === "DOWNVOTE") {
                downvoteDiff = 1;
                if (type === "UPVOTE") {
                  upvoteDiff = -1;
                  scoreDiff = -2;
                } else {
                  scoreDiff = -1;
                }
              } else {
                if (type === "UPVOTE") {
                  upvoteDiff = -1;
                  scoreDiff = -1;
                } else if (type === "DOWNVOTE") {
                  downvoteDiff = -1;
                  scoreDiff = 1;
                }
              }
              return {
                ...c,
                upvotes: c.upvotes + upvoteDiff,
                downvotes: c.downvotes + downvoteDiff,
                score: c.score + scoreDiff,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: revertTree(c.replies) };
            }
            return c;
          });
        };
        return {
          comments: revertTree(state.comments),
          activeCommentVotes: { ...state.activeCommentVotes, [commentId]: previousVote },
        };
      });
    }
  },

  giveAward: async (postIdOrCommentId, targetType, awardData) => {
    try {
      const endpoint = targetType === "POST"
        ? `/api/forum/posts/${postIdOrCommentId}/award`
        : `/api/forum/comments/${postIdOrCommentId}/award`;
        
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(awardData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to give award");
      const socket = get().socket;
      if (socket && data.data) {
        socket.emit("forum-new-award", {
          targetId: postIdOrCommentId,
          targetType,
          award: data.data,
        });
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchComments: async (postId) => {
    try {
      const res = await apiFetch(`/api/forum/posts/${postId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
      set({ comments: data.data || [] });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createComment: async (postId, content, parentId) => {
    try {
      const res = await apiFetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create comment");
      
      const newComment: SubforumComment = data.data;
      
      set((state) => {
        if (!parentId) {
          return { comments: [...state.comments, newComment] };
        }
        
        const addReplyToTree = (items: SubforumComment[]): SubforumComment[] => {
          return items.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: addReplyToTree(c.replies),
              };
            }
            return c;
          });
        };
        
        return { comments: addReplyToTree(state.comments) };
      });

      const socket = get().socket;
      if (socket) {
        socket.emit("forum-new-comment", { postId, comment: newComment });
      }
      
      return newComment;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  moderatePost: async (postId, action, reason, subforumId) => {
    try {
      const res = await apiFetch(`/api/forum/mod`, {
        method: "POST",
        body: JSON.stringify({ action, postId, reason, subforumId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation action failed");
      
      set((state) => {
        const posts = state.posts.map((p) => {
          if (p.id === postId) {
            if (action === "LOCK_POST") return { ...p, isLocked: true };
            if (action === "REMOVE_POST") return { ...p, isDeleted: true }; // soft delete flag
          }
          return p;
        });
        
        const activePost = state.activePost?.id === postId
          ? (action === "LOCK_POST" ? { ...state.activePost, isLocked: true } : null)
          : state.activePost;
          
        return { posts, activePost };
      });

      const socket = get().socket;
      if (socket) {
        const subId = subforumId || data.data?.subforumId;
        socket.emit("forum-mod-action", { subforumId: subId, action, targetPostId: postId, reason });
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  moderateComment: async (commentId, action, reason, subforumId) => {
    try {
      const res = await apiFetch(`/api/forum/mod`, {
        method: "POST",
        body: JSON.stringify({ action, commentId, reason, subforumId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation action failed");
      
      const removeCommentFromTree = (items: SubforumComment[]): SubforumComment[] => {
        return items.map((c) => {
          if (c.id === commentId) {
            return { ...c, isDeleted: true, content: "[removed by moderator]" };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: removeCommentFromTree(c.replies) };
          }
          return c;
        });
      };
      
      set((state) => ({
        comments: removeCommentFromTree(state.comments),
      }));

      const socket = get().socket;
      if (socket) {
        const subId = subforumId || data.data?.subforumId;
        socket.emit("forum-mod-action", { subforumId: subId, action: "REMOVE_COMMENT", targetCommentId: commentId, reason });
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  moderateUser: async (subforumId, targetUserId, action, reason) => {
    try {
      const res = await apiFetch(`/api/forum/mod`, {
        method: "POST",
        body: JSON.stringify({ action, subforumId, targetUserId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation action failed");

      const socket = get().socket;
      if (socket) {
        socket.emit("forum-mod-action", { subforumId, action, targetUserId, reason });
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  // Real-time local sync setters called from socket hook
  addCommentLocal: (comment) => {
    set((state) => {
      // Check if comment already exists in the tree to prevent duplicates
      const existsInTree = (items: SubforumComment[]): boolean => {
        for (const c of items) {
          if (c.id === comment.id) return true;
          if (c.replies && existsInTree(c.replies)) return true;
        }
        return false;
      };
      
      if (existsInTree(state.comments)) return {};
      
      if (!comment.parentId) {
        return { comments: [...state.comments, comment] };
      }
      
      const addReplyToTree = (items: SubforumComment[]): SubforumComment[] => {
        return items.map((c) => {
          if (c.id === comment.parentId) {
            const replies = c.replies || [];
            if (replies.find(r => r.id === comment.id)) return c;
            return { ...c, replies: [...replies, comment] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addReplyToTree(c.replies) };
          }
          return c;
        });
      };
      
      return { comments: addReplyToTree(state.comments) };
    });
  },

  updatePostScoreLocal: (postId, upvotes, downvotes, score) => {
    set((state) => {
      const posts = state.posts.map((p) => {
        if (p.id === postId) {
          return { ...p, upvotes, downvotes, score };
        }
        return p;
      });
      
      const activePost = state.activePost?.id === postId
        ? { ...state.activePost, upvotes, downvotes, score }
        : state.activePost;
        
      return { posts, activePost };
    });
  },

  updateCommentScoreLocal: (commentId, upvotes, downvotes, score) => {
    const updateScoreInTree = (items: SubforumComment[]): SubforumComment[] => {
      return items.map((c) => {
        if (c.id === commentId) {
          return { ...c, upvotes, downvotes, score };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateScoreInTree(c.replies) };
        }
        return c;
      });
    };
    
    set((state) => ({
      comments: updateScoreInTree(state.comments),
    }));
  },

  addAwardLocal: (award) => {
    // Could track awards in state, or we can just trigger a local visual effect/notification or reload active post
    set((state) => {
      if (state.activePost && state.activePost.id === award.targetId) {
        // Just trigger a re-render or similar
        return { activePost: { ...state.activePost } };
      }
      return {};
    });
  },

  applyModActionLocal: (modAction) => {
    set((state) => {
      const posts = state.posts
        .filter((p) => !(modAction.action === "REMOVE_POST" && p.id === modAction.targetPostId))
        .map((p) => {
          if (p.id === modAction.targetPostId && modAction.action === "LOCK_POST") {
            return { ...p, isLocked: true };
          }
          return p;
        });
      
      let activePost = state.activePost;
      if (activePost && activePost.id === modAction.targetPostId) {
        if (modAction.action === "LOCK_POST") {
          activePost = { ...activePost, isLocked: true };
        } else if (modAction.action === "REMOVE_POST") {
          activePost = null;
        }
      }
        
      if (modAction.action === "REMOVE_COMMENT" && modAction.targetCommentId) {
        const removeCommentFromTree = (items: SubforumComment[]): SubforumComment[] => {
          return items.map((c) => {
            if (c.id === modAction.targetCommentId) {
              return { ...c, isDeleted: true, content: "[removed by moderator]" };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: removeCommentFromTree(c.replies) };
            }
            return c;
          });
        };
        return { posts, activePost, comments: removeCommentFromTree(state.comments) };
      }
      
      return { posts, activePost };
    });
  },
}));
