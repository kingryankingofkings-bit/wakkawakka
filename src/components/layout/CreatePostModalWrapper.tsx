"use client";

import { useUIStore } from "@/store/uiStore";
import { CreatePostModal } from "@/components/feed/CreatePostModal";

export function CreatePostModalWrapper() {
  const { activeModal, setActiveModal } = useUIStore();
  
  return (
    <CreatePostModal 
      isOpen={activeModal === "createPost"} 
      onClose={() => setActiveModal(null)} 
    />
  );
}
