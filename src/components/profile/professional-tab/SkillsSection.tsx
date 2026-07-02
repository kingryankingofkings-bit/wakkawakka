import { Award, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SkillsSectionProps {
  profileData: any;
  endorsements: any[];
  authUser: any;
  isOwnProfile: boolean;
  profileUserId: string;
  endorseSkill: (_userId: string, _skill: string) => Promise<void>;
  fetchProfile: () => void;
}

export function SkillsSection({
  profileData,
  endorsements,
  authUser,
  isOwnProfile,
  profileUserId,
  endorseSkill,
  fetchProfile,
}: SkillsSectionProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Skills & Endorsements</h3>
      </div>

      {(!profileData?.skills || profileData.skills.length === 0) ? (
        <p className="text-sm text-muted-foreground">No skills listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profileData.skills.map((skill: string, index: number) => {
            const skillEndorsementList = endorsements.filter((e) => e.skill.toLowerCase() === skill.toLowerCase());
            const count = skillEndorsementList.length;
            const hasEndorsed = skillEndorsementList.some((e) => e.endorserId === authUser?.id);

            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">{skill}</span>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{count} endorsement{count !== 1 && "s"}</span>
                  </div>
                </div>

                {!isOwnProfile && (
                  <Button
                    size="xs"
                    variant={hasEndorsed ? "outline" : "primary"}
                    onClick={() => endorseSkill(profileUserId, skill).then(() => fetchProfile())}
                  >
                    {hasEndorsed ? "Endorsed" : "Endorse"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
