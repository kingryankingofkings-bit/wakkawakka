import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface EditProfileModalProps {
  editProfileOpen: boolean;
  setEditProfileOpen: (_open: boolean) => void;
  headline: string;
  setHeadline: (_headline: string) => void;
  skills: string[];
  newSkill: string;
  setNewSkill: (_skill: string) => void;
  addSkillTag: () => void;
  removeSkillTag: (_index: number) => void;
  handleUpdateProfile: (_e: React.FormEvent) => void;
}

export function EditProfileModal({
  editProfileOpen,
  setEditProfileOpen,
  headline,
  setHeadline,
  skills,
  newSkill,
  setNewSkill,
  addSkillTag,
  removeSkillTag,
  handleUpdateProfile,
}: EditProfileModalProps) {
  if (!editProfileOpen) return null;

  return (
    <Modal isOpen={editProfileOpen} title="Edit Professional Info" onClose={() => setEditProfileOpen(false)}>
      <form onSubmit={handleUpdateProfile} className="space-y-4 p-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Headline</label>
          <Input
            placeholder="e.g. Lead Architect at WakkaCorp"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Skills</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. TypeScript"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkillTag(); } }}
            />
            <Button type="button" onClick={addSkillTag}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <span>{skill}</span>
                <button type="button" onClick={() => removeSkillTag(i)}>
                  <X className="w-3.5 h-3.5 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setEditProfileOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
