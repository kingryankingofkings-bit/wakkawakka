import { Send } from "lucide-react";
import { CameraMode } from "@/store/cameraStore";

interface User {
  id: string;
  displayName: string;
}

interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  members: User[];
}

interface CameraPostConfirmationProps {
  cameraMode: CameraMode;
  conversations: Conversation[];
  user: User | null;
  selectedConversationId: string;
  setSelectedConversationId: (_id: string) => void;
  isPosting: boolean;
  handleDiscard: () => void;
  handleConfirmPost: () => void;
}

export function CameraPostConfirmation({
  cameraMode,
  conversations,
  user,
  selectedConversationId,
  setSelectedConversationId,
  isPosting,
  handleDiscard,
  handleConfirmPost,
}: CameraPostConfirmationProps) {
  return (
    <div className="w-full max-w-sm bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-center text-neutral-300">
        {cameraMode === "BE_REAL" && "⚡ Share Daily DailySnap"}
        {cameraMode === "NORMAL" && "📸 Share to Feed & Story"}
        {cameraMode === "DISAPPEARING" && "🔒 Send Disappearing Photo"}
      </h3>

      {cameraMode === "DISAPPEARING" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-neutral-400 font-medium">Select Friend / Chat</label>
          <select
            value={selectedConversationId}
            onChange={(e) => setSelectedConversationId(e.target.value)}
            className="w-full text-sm bg-neutral-800 text-white rounded-xl py-2 px-3 focus:outline-none border border-neutral-700/50"
          >
            <option value="">-- Choose recipient --</option>
            {conversations.map((c) => {
              const otherUser = c.members.find((m) => m.id !== user?.id) || c.members[0];
              return (
                <option key={c.id} value={c.id}>
                  {c.isGroup ? `👥 ${c.name}` : `👤 ${otherUser.displayName}`}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDiscard}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-850 transition text-neutral-400"
        >
          Discard
        </button>
        <button
          onClick={handleConfirmPost}
          disabled={isPosting || (cameraMode === "DISAPPEARING" && !selectedConversationId)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/95 transition text-white flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="h-4 w-4" />
          {isPosting ? "Posting..." : "Share"}
        </button>
      </div>
    </div>
  );
}
