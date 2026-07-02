import { motion, AnimatePresence } from "framer-motion";

const POPULAR_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "👍",
  "🔥",
  "🎉",
  "👏",
  "🙌",
  "✨",
  "❤️",
  "🤔",
  "😎",
  "💡",
  "🚀",
  "👀",
];

interface EmojiPickerProps {
  show: boolean;
  onEmojiSelect: (_emoji: string) => void;
}

export function EmojiPicker({ show, onEmojiSelect }: EmojiPickerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-2 p-2.5 bg-muted/50 border border-border rounded-xl">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onEmojiSelect(emoji)}
                className="text-lg p-1 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
