import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface WriteRecommendationModalProps {
  writeRecOpen: boolean;
  setWriteRecOpen: (_open: boolean) => void;
  recRelationship: string;
  setRecRelationship: (_relationship: string) => void;
  recText: string;
  setRecText: (_text: string) => void;
  handleWriteRecommendation: (_e: React.FormEvent) => void;
}

export function WriteRecommendationModal({
  writeRecOpen,
  setWriteRecOpen,
  recRelationship,
  setRecRelationship,
  recText,
  setRecText,
  handleWriteRecommendation,
}: WriteRecommendationModalProps) {
  if (!writeRecOpen) return null;

  return (
    <Modal isOpen={writeRecOpen} title="Write Recommendation" onClose={() => setWriteRecOpen(false)}>
      <form onSubmit={handleWriteRecommendation} className="space-y-4 p-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Relationship</label>
          <Input
            placeholder="e.g. Managed writer directly"
            value={recRelationship}
            onChange={(e) => setRecRelationship(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Recommendation</label>
          <textarea
            required
            className="w-full min-h-[120px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Explain what makes this professional stand out..."
            value={recText}
            onChange={(e) => setRecText(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setWriteRecOpen(false)}>Cancel</Button>
          <Button type="submit">Submit Recommendation</Button>
        </div>
      </form>
    </Modal>
  );
}

interface RequestRecommendationModalProps {
  requestRecOpen: boolean;
  setRequestRecOpen: (_open: boolean) => void;
  reqMessage: string;
  setReqMessage: (_message: string) => void;
  handleRequestRecommendation: (_e: React.FormEvent) => void;
}

export function RequestRecommendationModal({
  requestRecOpen,
  setRequestRecOpen,
  reqMessage,
  setReqMessage,
  handleRequestRecommendation,
}: RequestRecommendationModalProps) {
  if (!requestRecOpen) return null;

  return (
    <Modal isOpen={requestRecOpen} title="Request Recommendation" onClose={() => setRequestRecOpen(false)}>
      <form onSubmit={handleRequestRecommendation} className="space-y-4 p-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Personal Note</label>
          <textarea
            required
            className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Could you write me a recommendation based on our work together?"
            value={reqMessage}
            onChange={(e) => setReqMessage(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setRequestRecOpen(false)}>Cancel</Button>
          <Button type="submit">Send Request</Button>
        </div>
      </form>
    </Modal>
  );
}
