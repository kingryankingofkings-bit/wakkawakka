import { Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ProfileHeaderProps {
  profileData: any;
  isOwnProfile: boolean;
  authUser: any;
  setEditProfileOpen: (open: boolean) => void;
  setInMailOpen: (open: boolean) => void;
  setWriteRecOpen: (open: boolean) => void;
}

export function ProfileHeader({
  profileData,
  isOwnProfile,
  authUser,
  setEditProfileOpen,
  setInMailOpen,
  setWriteRecOpen,
}: ProfileHeaderProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Professional Profile</h2>
          <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
        <p className="text-sm font-medium text-primary">
          {profileData?.headline || "No professional headline set yet."}
        </p>
        {profileData?.courseRating !== undefined && (
          <p className="text-xs font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Award className="w-4 h-4" /> Creator Rating: [{profileData.courseRating.toFixed(1)}/10]
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {isOwnProfile ? (
          <Button size="sm" onClick={() => setEditProfileOpen(true)}>
            Edit Headline & Skills
          </Button>
        ) : (
          <>
            {authUser?.isPremium ? (
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setInMailOpen(true)}>
                Send InMail
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="opacity-70 cursor-not-allowed" title="Premium Required" onClick={() => toast.error("InMail requires Premium subscription!")}>
                Send InMail (Premium)
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={() => setWriteRecOpen(true)}>
              Recommend
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
