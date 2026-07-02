import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Zap, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import type { ProfessionalTier } from "@/types";
import toast from "react-hot-toast";

interface ProfessionalUpgradeModalProps {
  onClose: () => void;
}

const TIERS: {
  id: ProfessionalTier;
  name: string;
  price: string;
  freeLimit: string;
  paidLimit: string;
  waitPeriod: string;
  icon: any;
  color: string;
}[] = [
  {
    id: "SIMPLE",
    name: "Simple Pro",
    price: "$5/mo",
    freeLimit: "10 free courses/mo",
    paidLimit: "5 paid courses/mo",
    waitPeriod: "6 month wait for paid",
    icon: Star,
    color: "text-blue-500",
  },
  {
    id: "BETTER",
    name: "Better Pro",
    price: "$10/mo",
    freeLimit: "15 free courses/mo",
    paidLimit: "10 paid courses/mo",
    waitPeriod: "6 month wait for paid",
    icon: Zap,
    color: "text-purple-500",
  },
  {
    id: "BEST",
    name: "Best Pro",
    price: "$20/mo",
    freeLimit: "Unlimited free courses",
    paidLimit: "20 paid courses/mo",
    waitPeriod: "6 month wait for paid",
    icon: Award,
    color: "text-orange-500",
  },
  {
    id: "PURE",
    name: "Pure Professional",
    price: "$50/mo",
    freeLimit: "Unlimited free courses",
    paidLimit: "Unlimited paid courses",
    waitPeriod: "3 month wait for paid",
    icon: ShieldCheck,
    color: "text-emerald-500",
  },
];

export function ProfessionalUpgradeModal({ onClose }: ProfessionalUpgradeModalProps) {
  const user = useAuthStore((s) => s.activeProfile);
  const updateActiveProfile = useAuthStore((s) => s.updateActiveProfile);
  const [step, setStep] = useState<"TIER_SELECTION" | "ID_VERIFICATION">("TIER_SELECTION");
  const [selectedTier, setSelectedTier] = useState<ProfessionalTier | null>(null);
  const [_loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubscribe = (tierId: ProfessionalTier) => {
    setSelectedTier(tierId);
    setStep("ID_VERIFICATION");
  };

  const handleVerify = async () => {
    if (!selectedTier) return;
    setLoading(true);
    
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Subscribed to ${selectedTier} plan!`);
        toast.success("ID Verification Submitted & Approved!");
        
        updateActiveProfile({
          professionalTier: selectedTier,
          idVerificationStatus: "VERIFIED",
          isVerified: true,
          verificationTier: "BLUE",
        });
        
        onClose();
      } else {
        toast.error(data.message || "Subscription failed.");
      }
    } catch (e) {
      toast.error("Payment error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">
              {step === "TIER_SELECTION" ? "Upgrade Professional Tier" : "ID Verification"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === "TIER_SELECTION" 
                ? "Select a plan to unlock course creation." 
                : "Verify your identity to get the Authentic 'W' badge."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === "TIER_SELECTION" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                const isCurrent = user.professionalTier === tier.id;
                
                return (
                  <div key={tier.id} className={`border rounded-xl p-5 flex flex-col space-y-4 relative ${isCurrent ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 transition-colors"}`}>
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        CURRENT PLAN
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                      <h3 className="font-bold">{tier.name}</h3>
                    </div>
                    <div className="text-2xl font-black">{tier.price}</div>
                    
                    <ul className="space-y-2 flex-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {tier.freeLimit}
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {tier.paidLimit}
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        {tier.waitPeriod}
                      </li>
                    </ul>
                    
                    <Button 
                      variant={isCurrent ? "outline" : "primary"}
                      disabled={isCurrent}
                      onClick={() => handleSubscribe(tier.id)}
                      className="w-full mt-auto"
                    >
                      {isCurrent ? "Current Plan" : "Subscribe"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {step === "ID_VERIFICATION" && (
            <div className="max-w-md mx-auto space-y-6 py-8">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center space-y-4">
                <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto" />
                <div>
                  <h3 className="font-bold text-lg">Verify Your Identity</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    To start publishing courses and earn the &apos;W&apos; badge, you must securely verify your identity.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleVerify}>
                  Simulate ID Verification
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("TIER_SELECTION")}>
                  Back to Plans
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
