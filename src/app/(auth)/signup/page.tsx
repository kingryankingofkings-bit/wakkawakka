"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [profilesCount, setProfilesCount] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNext = () => {
    setIsNavigating(true);
    router.push(`/signup/account?count=${profilesCount}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to Wakka
        </h2>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          How many distinct profiles would you like to create for this account?
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => setProfilesCount(num)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              profilesCount === num
                ? "border-primary bg-primary/5 text-primary scale-105 shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
            )}
          >
            <span className="text-2xl font-bold">{num}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={isNavigating}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5",
          "bg-primary text-primary-foreground font-semibold text-base",
          "transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95",
          "disabled:opacity-60 disabled:pointer-events-none shadow-lg shadow-primary/25"
        )}
      >
        Continue to Account Details
        <ArrowRight className="w-5 h-5" />
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
