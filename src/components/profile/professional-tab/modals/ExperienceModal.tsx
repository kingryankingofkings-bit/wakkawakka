import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExperienceModalProps {
  experienceModalOpen: boolean;
  setExperienceModalOpen: (_open: boolean) => void;
  expCompany: string;
  setExpCompany: (_company: string) => void;
  expRole: string;
  setExpRole: (_role: string) => void;
  expStartDate: string;
  setExpStartDate: (_date: string) => void;
  expEndDate: string;
  setExpEndDate: (_date: string) => void;
  expDescription: string;
  setExpDescription: (_desc: string) => void;
  handleAddExperience: (_e: React.FormEvent) => void;
}

export function ExperienceModal({
  experienceModalOpen,
  setExperienceModalOpen,
  expCompany,
  setExpCompany,
  expRole,
  setExpRole,
  expStartDate,
  setExpStartDate,
  expEndDate,
  setExpEndDate,
  expDescription,
  setExpDescription,
  handleAddExperience,
}: ExperienceModalProps) {
  if (!experienceModalOpen) return null;

  return (
    <Modal isOpen={experienceModalOpen} title="Add Experience" onClose={() => setExperienceModalOpen(false)}>
      <form onSubmit={handleAddExperience} className="space-y-4 p-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Company</label>
            <Input required value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
            <Input required value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="Software Engineer" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
            <Input required type="date" value={expStartDate} onChange={(e) => setExpStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
            <Input type="date" value={expEndDate} onChange={(e) => setExpEndDate(e.target.value)} placeholder="Present" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
          <textarea
            className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={expDescription}
            onChange={(e) => setExpDescription(e.target.value)}
            placeholder="What did you do there?"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setExperienceModalOpen(false)}>Cancel</Button>
          <Button type="submit">Add Experience</Button>
        </div>
      </form>
    </Modal>
  );
}
