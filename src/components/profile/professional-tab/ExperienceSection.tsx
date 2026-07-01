import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExperienceSectionProps {
  profileData: any;
  isOwnProfile: boolean;
  setExperienceModalOpen: (open: boolean) => void;
}

export function ExperienceSection({ profileData, isOwnProfile, setExperienceModalOpen }: ExperienceSectionProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Experience</h3>
        </div>
        {isOwnProfile && (
          <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setExperienceModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </div>

      {(!profileData?.workHistory || JSON.parse(JSON.stringify(profileData.workHistory)).length === 0) ? (
        <p className="text-sm text-muted-foreground">No experience details added yet.</p>
      ) : (
        <div className="space-y-4 border-l border-border pl-4 ml-2">
          {profileData.workHistory.map((job: any, index: number) => (
            <div key={index} className="relative space-y-1">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
              <h4 className="text-sm font-bold text-foreground">{job.role}</h4>
              <p className="text-xs font-semibold text-muted-foreground">{job.company}</p>
              <p className="text-[11px] text-muted-foreground">{job.startDate} – {job.endDate || "Present"}</p>
              {job.description && (
                <p className="text-xs text-foreground/80 pt-1 leading-relaxed">{job.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
