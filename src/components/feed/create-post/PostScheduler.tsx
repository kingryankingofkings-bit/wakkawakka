import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostSchedulerProps {
  show: boolean;
  onClose: () => void;
  scheduledAt: Date | null;
  onScheduledAtChange: (_date: Date | null) => void;
}

export function PostScheduler({
  show,
  onClose,
  scheduledAt,
  onScheduledAtChange,
}: PostSchedulerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-3 space-y-2"
        >
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Schedule Publication
            </span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="datetime-local"
              value={
                scheduledAt
                  ? new Date(
                      scheduledAt.getTime() -
                        scheduledAt.getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                if (e.target.value) {
                  onScheduledAtChange(new Date(e.target.value));
                } else {
                  onScheduledAtChange(null);
                }
              }}
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none text-foreground"
            />
            {scheduledAt && (
              <button
                onClick={() => onScheduledAtChange(null)}
                className="text-xs text-destructive hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
