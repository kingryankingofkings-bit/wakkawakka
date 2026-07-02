import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RecommendationsSectionProps {
  recommendations: any[];
  isOwnProfile: boolean;
  setRequestRecOpen: (_open: boolean) => void;
  handleApproveRec: (_id: string) => void;
}

export function RecommendationsSection({
  recommendations,
  isOwnProfile,
  setRequestRecOpen,
  handleApproveRec,
}: RecommendationsSectionProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Recommendations</h3>
        </div>
        {!isOwnProfile && (
          <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setRequestRecOpen(true)}>
            Request
          </Button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recommendations received yet.</p>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec: any, index: number) => (
            <div key={index} className="p-4 rounded-xl border border-border bg-background/50 space-y-2 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{rec.writerName}</h4>
                  <p className="text-[10px] text-muted-foreground">Recommendation</p>
                </div>
                {isOwnProfile && rec.status === "PENDING" && (
                  <Button size="xs" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleApproveRec(rec.id)}>
                    Approve
                  </Button>
                )}
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed italic">&quot;{rec.text}&quot;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
