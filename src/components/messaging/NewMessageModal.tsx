"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USERS = [
  { id: "u2", username: "alex_dev", displayName: "Alex Developer", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: "u3", username: "sarah_design", displayName: "Sarah Designer", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: "u4", username: "mike_product", displayName: "Mike Product", avatar: "https://i.pravatar.cc/150?u=4" },
];

export function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = MOCK_USERS.filter((u) =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    toast.success("Starting conversation...");
    router.push(`/messages/${userId}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Message">
      <div className="p-4 space-y-4">
        <Input
          placeholder="Search for people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          autoFocus
        />

        <div className="space-y-1 mt-4 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors text-left"
              >
                <Avatar src={user.avatar} name={user.displayName} size="sm" />
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
