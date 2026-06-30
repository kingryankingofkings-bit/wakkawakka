"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRedditStore } from "@/store/redditStore";

export function useRedditSocket(postId?: string, subredditId?: string) {
  const { socket } = useSocket();
  const store = useRedditStore();
  const setSocket = useRedditStore((s) => s.setSocket);

  useEffect(() => {
    if (socket) {
      setSocket(socket);
    }
  }, [socket, setSocket]);

  useEffect(() => {
    if (!socket) return;

    // Join room for post to receive live votes, comments, awards
    if (postId) {
      socket.emit("join-reddit-post", postId);

      const handleNewComment = (comment: any) => {
        store.addCommentLocal(comment);
      };

      const handleVoteUpdate = (data: any) => {
        if (data.targetId === postId && data.targetType === "POST") {
          store.updatePostScoreLocal(postId, data.upvotes, data.downvotes, data.score);
        } else if (data.targetType === "COMMENT") {
          store.updateCommentScoreLocal(data.targetId, data.upvotes, data.downvotes, data.score);
        }
      };

      const handleNewAward = (data: any) => {
        if (data.targetId === postId) {
          store.addAwardLocal(data.award || data);
        }
      };

      socket.on("reddit-comment-received", handleNewComment);
      socket.on("reddit-vote-updated", handleVoteUpdate);
      socket.on("reddit-award-received", handleNewAward);

      return () => {
        socket.emit("leave-reddit-post", postId);
        socket.off("reddit-comment-received", handleNewComment);
        socket.off("reddit-vote-updated", handleVoteUpdate);
        socket.off("reddit-award-received", handleNewAward);
      };
    }

    // Join room for subreddit to receive moderation updates
    if (subredditId) {
      socket.emit("join-reddit-subreddit", subredditId);

      const handleModAction = (data: any) => {
        store.applyModActionLocal(data);
      };

      socket.on("reddit-mod-action-alert", handleModAction);

      return () => {
        socket.emit("leave-reddit-subreddit", subredditId);
        socket.off("reddit-mod-action-alert", handleModAction);
      };
    }
  }, [socket, postId, subredditId, store]);
}
