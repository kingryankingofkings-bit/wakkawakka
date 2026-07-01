"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useForumStore } from "@/store/forumStore";

export function useForumSocket(postId?: string, subforumId?: string) {
  const { socket } = useSocket();
  const store = useForumStore();
  const setSocket = useForumStore((s) => s.setSocket);

  useEffect(() => {
    if (socket) {
      setSocket(socket);
    }
  }, [socket, setSocket]);

  useEffect(() => {
    if (!socket) return;

    // Join room for post to receive live votes, comments, awards
    if (postId) {
      socket.emit("join-forum-post", postId);

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

      socket.on("forum-comment-received", handleNewComment);
      socket.on("forum-vote-updated", handleVoteUpdate);
      socket.on("forum-award-received", handleNewAward);

      return () => {
        socket.emit("leave-forum-post", postId);
        socket.off("forum-comment-received", handleNewComment);
        socket.off("forum-vote-updated", handleVoteUpdate);
        socket.off("forum-award-received", handleNewAward);
      };
    }

    // Join room for subforum to receive moderation updates
    if (subforumId) {
      socket.emit("join-forum-subforum", subforumId);

      const handleModAction = (data: any) => {
        store.applyModActionLocal(data);
      };

      socket.on("forum-mod-action-alert", handleModAction);

      return () => {
        socket.emit("leave-forum-subforum", subforumId);
        socket.off("forum-mod-action-alert", handleModAction);
      };
    }
  }, [socket, postId, subforumId, store]);
}
