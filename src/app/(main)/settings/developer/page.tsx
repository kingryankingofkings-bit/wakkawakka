"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Play,
  Plus,
  Terminal,
  RefreshCw,
  Check,
  X,
  Megaphone,
  Activity,
} from "lucide-react";

export default function DeveloperSettingsPage() {
  const [activeConsoleTab, setActiveConsoleTab] = useState<"ads" | "webhooks">(
    "ads",
  );

  // Ad Campaigns States
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adCopy, setAdCopy] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adTargetUrl, setAdTargetUrl] = useState("");
  const [adBudget, setAdBudget] = useState("");
  const [adBidAmount, setAdBidAmount] = useState("");
  const [adAgeMin, setAdAgeMin] = useState("");
  const [adAgeMax, setAdAgeMax] = useState("");
  const [adGender, setAdGender] = useState("All");
  const [adLocation, setAdLocation] = useState("");

  // Webhooks States
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("tip.received");

  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    const userId = useAuthStore.getState().activeProfile?.id;
    const headers: Record<string, string> = userId
      ? { "x-user-id": userId }
      : {};

    try {
      // Fetch Ad Campaigns
      const adsRes = await fetch("/api/ads", { headers });
      const adsJson = await adsRes.json();
      if (adsJson.data) setCampaigns(adsJson.data);

      // Fetch Webhook Subscriptions
      const whRes = await fetch("/api/developer/webhooks", { headers });
      const whJson = await whRes.json();
      if (whJson.data) setWebhooks(whJson.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Ad Campaign
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adCopy || !adTargetUrl || !adBudget || !adBidAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const userId = useAuthStore.getState().activeProfile?.id;
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          title: adTitle,
          copy: adCopy,
          imageUrl: adImageUrl || null,
          targetUrl: adTargetUrl,
          budget: parseFloat(adBudget),
          bidAmount: parseFloat(adBidAmount),
          ageMin: adAgeMin ? parseInt(adAgeMin) : null,
          ageMax: adAgeMax ? parseInt(adAgeMax) : null,
          gender: adGender,
          location: adLocation || null,
        }),
      });

      if (res.ok) {
        toast.success("Ad campaign created successfully!");
        setIsCreatingAd(false);
        // Reset form
        setAdTitle("");
        setAdCopy("");
        setAdImageUrl("");
        setAdTargetUrl("");
        setAdBudget("");
        setAdBidAmount("");
        setAdAgeMin("");
        setAdAgeMax("");
        setAdGender("All");
        setAdLocation("");
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to create campaign");
      }
    } catch (err) {
      toast.error("Network error creating campaign");
    }
  };

  // Create Webhook Subscription
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !webhookEvents) {
      toast.error("Please enter a webhook URL");
      return;
    }

    const userId = useAuthStore.getState().activeProfile?.id;
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: webhookEvents.split(",").map((e) => e.trim()),
        }),
      });

      if (res.ok) {
        toast.success("Webhook registered successfully!");
        setIsCreatingWebhook(false);
        setWebhookUrl("");
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to register webhook");
      }
    } catch (err) {
      toast.error("Network error registering webhook");
    }
  };

  // Toggle Webhook Active Status
  const handleToggleWebhook = async (id: string, currentStatus: boolean) => {
    const userId = useAuthStore.getState().activeProfile?.id;
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      });

      if (res.ok) {
        toast.success(
          `Webhook ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        );
        fetchData();
      } else {
        toast.error("Failed to update webhook status");
      }
    } catch (err) {
      toast.error("Network error updating webhook");
    }
  };

  // Trigger Test Event
  const handleTriggerTest = async (subscriptionId: string) => {
    toast.loading("Sending test tipping event...", { id: "trigger-test" });
    try {
      const res = await fetch("/api/developer/webhooks/test-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.data.success
            ? `Webhook delivered successfully! Status: ${data.data.statusCode}`
            : `Webhook delivery failed. Error: ${data.data.responseBody || "Unknown error"}`,
          { id: "trigger-test" },
        );
        fetchData();
      } else {
        toast.error(data.error || "Failed to trigger test event", {
          id: "trigger-test",
        });
      }
    } catch (err) {
      toast.error("Network error triggering test", { id: "trigger-test" });
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Developer & Advertiser Console</h1>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-muted rounded-2xl p-1 border border-border">
          <button
            onClick={() => setActiveConsoleTab("ads")}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              activeConsoleTab === "ads"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Megaphone className="h-4 w-4" />
            Ad Campaigns
          </button>
          <button
            onClick={() => setActiveConsoleTab("webhooks")}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              activeConsoleTab === "webhooks"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Terminal className="h-4 w-4" />
            Developer Webhooks
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : activeConsoleTab === "ads" ? (
          /* Advertiser Campaign Manager Section */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-base text-foreground">
                  Your Ad Campaigns
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage and track your active sponsored feeds
                </p>
              </div>
              <Button size="sm" onClick={() => setIsCreatingAd(true)}>
                <Plus className="h-4 w-4" /> Create Ad
              </Button>
            </div>

            {/* Create Ad Form Modal */}
            {isCreatingAd && (
              <Card padding="md" className="border-primary/20 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="font-bold text-sm text-foreground">
                    New Ad Campaign
                  </h3>
                  <button
                    onClick={() => setIsCreatingAd(false)}
                    className="p-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateAd} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">
                        Ad Title *
                      </label>
                      <Input
                        required
                        placeholder="E.g., Wakka Premium Music"
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">
                        Target URL *
                      </label>
                      <Input
                        required
                        type="url"
                        placeholder="https://..."
                        value={adTargetUrl}
                        onChange={(e) => setAdTargetUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Ad Copy *
                    </label>
                    <Input
                      required
                      placeholder="E.g., Get 50% off on all creator albums this summer!"
                      value={adCopy}
                      onChange={(e) => setAdCopy(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Image URL (Optional)
                    </label>
                    <Input
                      placeholder="https://..."
                      value={adImageUrl}
                      onChange={(e) => setAdImageUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">
                        Total Budget ($) *
                      </label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={adBudget}
                        onChange={(e) => setAdBudget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">
                        Bid Per Click ($) *
                      </label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.25"
                        value={adBidAmount}
                        onChange={(e) => setAdBidAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Demographic Targeting */}
                  <div className="border-t border-border pt-2 mt-2 space-y-2">
                    <h4 className="font-bold text-muted-foreground text-[10px] uppercase">
                      Demographic Targeting
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">
                          Min Age
                        </label>
                        <Input
                          type="number"
                          placeholder="18"
                          value={adAgeMin}
                          onChange={(e) => setAdAgeMin(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">
                          Max Age
                        </label>
                        <Input
                          type="number"
                          placeholder="45"
                          value={adAgeMax}
                          onChange={(e) => setAdAgeMax(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">
                          Gender
                        </label>
                        <select
                          value={adGender}
                          onChange={(e) => setAdGender(e.target.value)}
                          className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="All">All Genders</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">
                          Target Location
                        </label>
                        <Input
                          placeholder="E.g., London"
                          value={adLocation}
                          onChange={(e) => setAdLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingAd(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Publish Campaign</Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-xs bg-card border border-border border-dashed rounded-3xl">
                No campaigns created yet. Start promoting your goods!
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((ad) => {
                  const ctr =
                    ad.impressions > 0
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                      : "0.00";
                  return (
                    <Card key={ad.id} padding="md" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {ad.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate max-w-sm">
                            {ad.copy}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            ad.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-500",
                          )}
                        >
                          {ad.isActive ? "Active" : "Paused"}
                        </span>
                      </div>

                      {/* Campaign stats metrics grid */}
                      <div className="grid grid-cols-4 gap-2 text-center border-t border-border pt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Impressions
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {ad.impressions}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Clicks
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {ad.clicks}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            CTR
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {ctr}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Spent
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(ad.spent)} /{" "}
                            {formatCurrency(ad.budget)}
                          </p>
                        </div>
                      </div>

                      {/* Targeting config */}
                      <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-xl">
                        <span className="font-semibold text-foreground">
                          Targeting:
                        </span>{" "}
                        Age {ad.ageMin || "13"}-{ad.ageMax || "100"} · Gender:{" "}
                        {ad.gender || "All"} · Location:{" "}
                        {ad.location || "Global"}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Developer Webhooks Section */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-base text-foreground">
                  Webhook Subscriptions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure HTTP callbacks for real-time app events
                </p>
              </div>
              <Button size="sm" onClick={() => setIsCreatingWebhook(true)}>
                <Plus className="h-4 w-4" /> Add Endpoint
              </Button>
            </div>

            {/* Create Webhook Form */}
            {isCreatingWebhook && (
              <Card padding="md" className="border-primary/20 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="font-bold text-sm text-foreground">
                    Register Webhook
                  </h3>
                  <button
                    onClick={() => setIsCreatingWebhook(false)}
                    className="p-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form
                  onSubmit={handleCreateWebhook}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Payload URL *
                    </label>
                    <Input
                      required
                      type="url"
                      placeholder="https://yourserver.com/webhooks"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Subscribe Events (comma separated) *
                    </label>
                    <Input
                      required
                      placeholder="tip.received, post.created"
                      value={webhookEvents}
                      onChange={(e) => setWebhookEvents(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingWebhook(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Subscription</Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Webhooks list & logs */}
            {webhooks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-xs bg-card border border-border border-dashed rounded-3xl">
                No webhooks configured yet. Build dynamic integrations!
              </div>
            ) : (
              <div className="space-y-6">
                {webhooks.map((wh) => (
                  <Card key={wh.id} padding="md" className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                          {wh.url}
                        </p>
                        <p className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block">
                          Events: {wh.events}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            Secret:
                          </span>
                          <code className="text-[10px] bg-muted/80 px-1.5 py-0.5 rounded font-mono select-all text-primary">
                            {wh.secret}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Active toggle */}
                        <button
                          onClick={() =>
                            handleToggleWebhook(wh.id, wh.isActive)
                          }
                          className={cn(
                            "w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none",
                            wh.isActive ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full bg-card shadow-sm transition-transform",
                              wh.isActive ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>

                        {/* Test event trigger */}
                        <button
                          onClick={() => handleTriggerTest(wh.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-border bg-card text-[10px] font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
                        >
                          <Play className="h-3 w-3 fill-current text-primary" />{" "}
                          Test
                        </button>
                      </div>
                    </div>

                    {/* Delivery logs sub-section */}
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Activity className="h-3.5 w-3.5" /> Delivery Logs (
                        {wh.deliveryLogs?.length || 0})
                      </div>
                      {wh.deliveryLogs?.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">
                          No events delivered yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto divide-y divide-border/50 pr-1">
                          {wh.deliveryLogs.map((log: any) => (
                            <div
                              key={log.id}
                              className="pt-1.5 first:pt-0 flex flex-col gap-1 text-[10px]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {log.success ? (
                                    <span className="flex items-center gap-0.5 text-green-500 font-bold">
                                      <Check className="h-3 w-3" />{" "}
                                      {log.statusCode || 200}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-red-500 font-bold">
                                      <X className="h-3 w-3" />{" "}
                                      {log.statusCode || "FAIL"}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground font-mono">
                                    {log.durationMs}ms
                                  </span>
                                </div>
                                <span className="text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="bg-muted/30 p-1.5 rounded-lg font-mono text-[9px] text-muted-foreground break-all max-h-16 overflow-y-auto">
                                <p className="font-semibold text-foreground">
                                  Payload:
                                </p>
                                {log.payload}
                                {log.responseBody && (
                                  <>
                                    <p className="font-semibold text-foreground mt-1">
                                      Response:
                                    </p>
                                    {log.responseBody}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
