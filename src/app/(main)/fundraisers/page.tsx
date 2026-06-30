"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import {
  Heart,
  Plus,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function FundraisersPage() {
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Fundraiser Form
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  // Donation Checkout Modal
  const [selectedFundraiser, setSelectedFundraiser] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationStep, setDonationStep] = useState<
    "form" | "processing" | "success"
  >("form");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const fetchFundraisers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/fundraisers");
      const json = await res.json();
      if (json.data) setFundraisers(json.data);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !goalAmount) {
      toast.error("Please enter a title and goal amount");
      return;
    }

    const userId = useAuthStore.getState().user?.id;
    try {
      const res = await fetch("/api/fundraisers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          goalAmount: parseFloat(goalAmount),
        }),
      });

      if (res.ok) {
        toast.success("Charitable fundraiser published!");
        setIsCreating(false);
        setTitle("");
        setDescription("");
        setGoalAmount("");
        fetchFundraisers();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to create fundraiser");
      }
    } catch {
      toast.error("Connection issue publishing campaign");
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Please specify a positive donation amount");
      return;
    }
    if (!cardName || !cardNumber || !cardExpiry || !cardCVC) {
      toast.error("Please enter credit card billing details");
      return;
    }

    setDonationStep("processing");
    const userId = useAuthStore.getState().user?.id;

    try {
      const res = await fetch(
        `/api/fundraisers/${selectedFundraiser.id}/donate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userId ? { "x-user-id": userId } : {}),
          },
          body: JSON.stringify({
            amount: parseFloat(donationAmount),
          }),
        },
      );

      if (res.ok) {
        setDonationStep("success");
        toast.success("Donation completed successfully!");
        fetchFundraisers();
      } else {
        const json = await res.json();
        toast.error(json.error || "Donation failed");
        setDonationStep("form");
      }
    } catch {
      toast.error("Connection issue processing donation");
      setDonationStep("form");
    }
  };

  const closeDonationModal = () => {
    setSelectedFundraiser(null);
    setDonationAmount("");
    setDonationStep("form");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCVC("");
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <Heart className="h-5 w-5 fill-current" /> Fundraisers
        </h1>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" /> Start Campaign
        </Button>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Create Campaign Card */}
        {isCreating && (
          <Card padding="md" className="border-rose-500/20 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground">
                Launch Charitable Fundraiser
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={handleCreateFundraiser}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Campaign Title *
                </label>
                <Input
                  required
                  placeholder="E.g., Medical relief for animal shelter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Description
                </label>
                <Input
                  placeholder="Describe the cause..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Goal Amount ($) *
                </label>
                <Input
                  required
                  type="number"
                  placeholder="5000.00"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">Publish Fundraiser</Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : fundraisers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs bg-card border border-border border-dashed rounded-3xl">
            No fundraiser campaigns published yet. Create one to support local
            causes!
          </div>
        ) : (
          <div className="space-y-4">
            {fundraisers.map((f) => {
              const progress =
                Math.min(
                  100,
                  Math.round((f.raisedAmount / f.goalAmount) * 100),
                ) || 0;
              return (
                <Card
                  key={f.id}
                  padding="md"
                  className="space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {f.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {f.description || "Supporting a noble cause."}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                      {f.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>{formatCurrency(f.raisedAmount)} raised</span>
                      <span>
                        Goal: {formatCurrency(f.goalAmount)} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-rose-500 text-white hover:bg-rose-600"
                    onClick={() => {
                      setSelectedFundraiser(f);
                      setDonationStep("form");
                    }}
                  >
                    Donate Now
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Donation Checkout Modal */}
      {selectedFundraiser && (
        <Modal
          isOpen={!!selectedFundraiser}
          onClose={closeDonationModal}
          title={`Donate to: ${selectedFundraiser.title}`}
        >
          {donationStep === "form" && (
            <form
              onSubmit={handleDonationSubmit}
              className="p-4 space-y-4 text-xs"
            >
              <div className="flex items-center gap-2 bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-[10px] text-rose-600 font-medium">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Simulated Secure Checkout powered by Stripe sandbox.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Donation Amount ($) *
                </label>
                <Input
                  required
                  type="number"
                  placeholder="25.00"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  leftIcon={
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Cardholder Name *
                  </label>
                  <Input
                    required
                    placeholder="Jane Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Card Number *
                  </label>
                  <Input
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Expiry Date *
                    </label>
                    <Input
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      CVC *
                    </label>
                    <Input
                      required
                      placeholder="123"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={closeDonationModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-rose-500 text-white hover:bg-rose-600"
                >
                  Donate{" "}
                  {donationAmount
                    ? formatCurrency(parseFloat(donationAmount))
                    : ""}
                </Button>
              </div>
            </form>
          )}

          {donationStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
              <p className="text-sm font-semibold">
                Authorizing secure donation...
              </p>
            </div>
          )}

          {donationStep === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center p-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 animate-bounce-subtle" />
              <div>
                <h3 className="font-bold text-base">
                  Thank you for your donation!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your contribution has been successfully credited to this
                  campaign.
                </p>
              </div>
              <Button
                className="w-full bg-rose-500 text-white hover:bg-rose-600"
                onClick={closeDonationModal}
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
