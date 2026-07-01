import { X, MinusCircle, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PollCreatorProps {
  show: boolean;
  onClose: () => void;
  question: string;
  onQuestionChange: (q: string) => void;
  options: string[];
  onOptionsChange: (opts: string[]) => void;
}

export function PollCreator({
  show,
  onClose,
  question,
  onQuestionChange,
  options,
  onOptionsChange,
}: PollCreatorProps) {
  const handleAddPollOption = () => {
    if (options.length < 5) {
      onOptionsChange([...options, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (options.length > 2) {
      onOptionsChange(options.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    onOptionsChange(options.map((o, i) => (i === index ? val : o)));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Create a Poll
            </h4>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => handlePollOptionChange(i, e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemovePollOption(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 5 && (
            <button
              onClick={handleAddPollOption}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors pt-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add Option
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
