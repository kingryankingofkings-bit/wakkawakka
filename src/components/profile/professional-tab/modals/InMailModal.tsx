import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

interface InMailModalProps {
  inMailOpen: boolean;
  setInMailOpen: (_open: boolean) => void;
  profileUserId: string;
  inMailSubject: string;
  setInMailSubject: (_subject: string) => void;
  inMailBody: string;
  setInMailBody: (_body: string) => void;
  inMailSending: boolean;
  handleSendInMail: (_e: React.FormEvent) => void;
}

export function InMailModal({
  inMailOpen,
  setInMailOpen,
  profileUserId,
  inMailSubject,
  setInMailSubject,
  inMailBody,
  setInMailBody,
  inMailSending,
  handleSendInMail,
}: InMailModalProps) {
  if (!inMailOpen) return null;

  return (
    <Modal isOpen={inMailOpen} title={`Send Premium InMail to @${profileUserId}`} onClose={() => setInMailOpen(false)}>
      <form onSubmit={handleSendInMail} className="space-y-4 p-2">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>You are using a Premium InMail credit. InMails allow you to message professionals directly even if you are not connected.</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
          <Input
            required
            placeholder="Collaboration Invitation / Job Opportunity"
            value={inMailSubject}
            onChange={(e) => setInMailSubject(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Message</label>
          <textarea
            required
            className="w-full min-h-[150px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type your professional message here..."
            value={inMailBody}
            onChange={(e) => setInMailBody(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setInMailOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={inMailSending}>
            {inMailSending ? "Sending..." : "Send InMail"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
