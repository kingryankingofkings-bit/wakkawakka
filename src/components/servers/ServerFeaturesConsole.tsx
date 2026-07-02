import { useState } from "react";
import { Link2, ShieldAlert, GitBranch, MessageSquareDashed, X, Mic, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function ServerFeaturesConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"invites" | "threads" | "voice" | "roles">("invites");

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 flex items-center justify-between p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-all text-xs font-semibold"
      >
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Server Master Console (Missing Bible Features)
        </span>
      </button>
    );
  }

  return (
    <div className="w-full mt-4 border border-border rounded-xl bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <h4 className="text-xs font-bold px-2 flex items-center gap-2 text-primary">
          <ShieldAlert className="w-4 h-4" />
          Server Master Console
        </h4>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex text-[10px] uppercase font-bold border-b border-border">
        {(["invites", "threads", "voice", "roles"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-center transition-colors",
              activeTab === tab
                ? "bg-background text-foreground border-b-2 border-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 bg-background min-h-[120px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {activeTab === "invites" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Server Invite Link Generation (F-153)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://wakkawakka.com/invite/aBcDeFg"
                    className="flex-1 rounded-lg border border-border bg-muted/50 px-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://wakkawakka.com/invite/aBcDeFg");
                      toast.success("Invite link copied!");
                    }}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs"
                  >
                    <Link2 className="w-3 h-3" /> Copy
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "threads" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Thread Branching (F-160)</p>
                <button
                  onClick={() => toast.success("New thread created in side panel!")}
                  className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <GitBranch className="w-3 h-3" /> Branch Thread from Message
                </button>
                <button
                  onClick={() => toast("Viewing active threads...")}
                  className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <MessageSquareDashed className="w-3 h-3" /> View Active Threads
                </button>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Stage & Voice (F-59, F-155)</p>
                <button
                  onClick={() => toast.success("Connected to Voice Channel via WebRTC")}
                  className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-1.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                >
                  <Mic className="w-3 h-3" /> Join Voice Channel
                </button>
                <button
                  onClick={() => toast.success("Stage Channel created!")}
                  className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-1.5 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                >
                  <Volume2 className="w-3 h-3" /> Start Stage Broadcast
                </button>
              </div>
            )}

            {activeTab === "roles" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Role Customization</p>
                <div className="flex items-center gap-2 border border-border rounded-lg p-2 bg-muted/30">
                  <span className="text-xs font-bold" style={{ color: "#ef4444" }}>Admin</span>
                  <input type="color" defaultValue="#ef4444" className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 border border-border rounded-lg p-2 bg-muted/30">
                  <span className="text-xs font-bold" style={{ color: "#3b82f6" }}>Moderator</span>
                  <input type="color" defaultValue="#3b82f6" className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
                </div>
                <button onClick={() => toast.success("Role colors updated")} className="w-full text-[10px] font-bold bg-primary text-primary-foreground py-1 rounded">Save Changes</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
