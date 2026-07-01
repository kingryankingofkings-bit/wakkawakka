import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { BarChart3, CreditCard, Receipt } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface AnalyticsSectionProps {
  isOwnProfile: boolean;
  tier: string;
  userId?: string;
  authUser?: any;
}

export function AnalyticsSection({ isOwnProfile, tier, userId, authUser }: AnalyticsSectionProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOwnProfile && userId) {
      fetch(`/api/payments/history?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSubscriptions(data.data.subscriptions || []);
            setInvoices(data.data.invoices || []);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isOwnProfile, userId]);

  if (!isOwnProfile) return null;

  return (
    <Card padding="md" className="space-y-6">
      <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Professional Analytics</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-6"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscriptions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Active Subscriptions
            </h3>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active subscriptions.</p>
            ) : (
              <div className="space-y-2">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="p-3 bg-muted/30 border border-border/40 rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{sub.plan}</p>
                      <p className="text-xs text-muted-foreground">{sub.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{sub.price}</p>
                      <span className="text-[10px] uppercase font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              Billing & Invoices
            </h3>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices available.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-3 bg-muted/30 border border-border/40 rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">Invoice #{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.date}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{inv.amount}</p>
                        <p className="text-xs text-muted-foreground">{inv.status}</p>
                      </div>
                      <a href={inv.pdfUrl} className="text-xs text-primary hover:underline">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Course Quotas and Ratings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Course Creation Quotas
            </h3>
            {authUser ? (
              <div className="p-3 bg-muted/30 border border-border/40 rounded-md space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Free Courses</span>
                    <span className="font-bold">{authUser.freeCoursesCreatedThisMonth || 0} / {tier === "NONE" ? 0 : tier === "SIMPLE" ? 10 : tier === "BETTER" ? 15 : "∞"}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((authUser.freeCoursesCreatedThisMonth || 0) / (tier === "SIMPLE" ? 10 : tier === "BETTER" ? 15 : 9999)) * 100)}%` 
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Paid Courses</span>
                    <span className="font-bold">{authUser.paidCoursesCreatedThisMonth || 0} / {tier === "NONE" ? 0 : tier === "SIMPLE" ? 5 : tier === "BETTER" ? 10 : tier === "BEST" ? 20 : "∞"}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((authUser.paidCoursesCreatedThisMonth || 0) / (tier === "SIMPLE" ? 5 : tier === "BETTER" ? 10 : tier === "BEST" ? 20 : 9999)) * 100)}%` 
                      }} 
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-border/40 flex justify-between items-center text-sm">
                  <span>Instructor Rating</span>
                  <span className="font-bold flex items-center gap-1 text-yellow-500">
                    ★ {authUser.courseRating?.toFixed(1) || "New"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Log in to view quotas.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
