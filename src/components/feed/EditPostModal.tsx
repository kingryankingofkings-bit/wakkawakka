"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useFeedStore } from "@/store/feedStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import type { Post } from "@/types";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const updatePost = useFeedStore((s) => s.updatePost);
  const user = useAuthStore((s) => s.user);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      updatePost(post.id, { content });
      toast.success("Post updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit post">
      <div className="p-4 space-y-4">
        <div className="flex gap-4">
          <Avatar src={user.avatar} name={user.displayName} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-lg placeholder:text-muted-foreground min-h-[120px]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!content.trim() || content === post.content}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
