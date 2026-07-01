import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface EducationModalProps {
  educationModalOpen: boolean;
  setEducationModalOpen: (open: boolean) => void;
  eduSchool: string;
  setEduSchool: (school: string) => void;
  eduDegree: string;
  setEduDegree: (degree: string) => void;
  eduStartDate: string;
  setEduStartDate: (date: string) => void;
  eduEndDate: string;
  setEduEndDate: (date: string) => void;
  handleAddEducation: (e: React.FormEvent) => void;
}

export function EducationModal({
  educationModalOpen,
  setEducationModalOpen,
  eduSchool,
  setEduSchool,
  eduDegree,
  setEduDegree,
  eduStartDate,
  setEduStartDate,
  eduEndDate,
  setEduEndDate,
  handleAddEducation,
}: EducationModalProps) {
  if (!educationModalOpen) return null;

  return (
    <Modal isOpen={educationModalOpen} title="Add Education" onClose={() => setEducationModalOpen(false)}>
      <form onSubmit={handleAddEducation} className="space-y-4 p-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">School / University</label>
            <Input required value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} placeholder="Stanford University" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Degree / Field</label>
            <Input required value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} placeholder="B.S. Computer Science" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
            <Input required type="date" value={eduStartDate} onChange={(e) => setEduStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
            <Input type="date" value={eduEndDate} onChange={(e) => setEduEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setEducationModalOpen(false)}>Cancel</Button>
          <Button type="submit">Add Education</Button>
        </div>
      </form>
    </Modal>
  );
}
