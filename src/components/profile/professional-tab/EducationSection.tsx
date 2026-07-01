import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EducationSectionProps {
  profileData: any;
  isOwnProfile: boolean;
  setEducationModalOpen: (open: boolean) => void;
}

export function EducationSection({ profileData, isOwnProfile, setEducationModalOpen }: EducationSectionProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Education</h3>
        </div>
        {isOwnProfile && (
          <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setEducationModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </div>

      {(!profileData?.education || JSON.parse(JSON.stringify(profileData.education)).length === 0) ? (
        <p className="text-sm text-muted-foreground">No education details added yet.</p>
      ) : (
        <div className="space-y-4 border-l border-border pl-4 ml-2">
          {profileData.education.map((edu: any, index: number) => (
            <div key={index} className="relative space-y-0.5">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
              <h4 className="text-sm font-bold text-foreground">{edu.school}</h4>
              <p className="text-xs font-semibold text-muted-foreground">{edu.degree}</p>
              <p className="text-[11px] text-muted-foreground">{edu.startDate} – {edu.endDate || "Present"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
