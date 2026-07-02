"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, AtSign, Loader2, CheckCircle2, Monitor, Users2, Building, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const profileSchema = z.object({
  type: z.enum(["STREAMING", "SOCIALIZING", "ANONYMOUS", "LEARNING", "PROFESSIONAL"]),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be 3-20 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const PROFILE_TYPES = [
  { id: "STREAMING", label: "Streaming", icon: Monitor, desc: "For live streaming and gaming" },
  { id: "SOCIALIZING", label: "Socializing", icon: Users2, desc: "Connect with friends and family" },
  { id: "ANONYMOUS", label: "Anonymous", icon: User, desc: "Interact privately and anonymously" },
  { id: "LEARNING", label: "Learning", icon: GraduationCap, desc: "Teach or take courses" },
  { id: "PROFESSIONAL", label: "Professional", icon: Briefcase, desc: "Networking and career growth" },
] as const;

function SignupProfilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const count = parseInt(searchParams.get("count") || "1", 10);
  const current = parseInt(searchParams.get("current") || "1", 10);

  const { registerProfile } = useAuth(); // Assume we created this hook function
  const [selectedType, setSelectedType] = useState<string>("SOCIALIZING");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { type: "SOCIALIZING", displayName: "", username: "" },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await registerProfile(data.type, data.displayName, data.username);
      toast.success(`Profile ${current} created!`);
      
      if (current < count) {
        reset();
        router.push(`/signup/profiles?count=${count}&current=${current + 1}`);
      } else {
        toast.success("All profiles created successfully! 🎉");
        router.push("/explore");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create profile.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create Profile {current} of {count}
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a persona type and set up this profile&apos;s basic identity.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Profile Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">What is this profile for?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROFILE_TYPES.map((pt) => {
              const Icon = pt.icon;
              const isSelected = selectedType === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedType(pt.id)}
                  className={cn(
                    "cursor-pointer flex flex-col p-3 rounded-lg border-2 transition-all",
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>{pt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{pt.desc}</p>
                </div>
              );
            })}
          </div>
          {/* Hidden input to pass selected type to React Hook Form */}
          <input type="hidden" value={selectedType} {...register("type")} />
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Display Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. Alex Rivera"
              {...register("displayName")}
              className={cn("w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-background", errors.displayName ? "border-destructive" : "border-input")}
            />
          </div>
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. alex_creates"
              {...register("username")}
              className={cn("w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-background", errors.username ? "border-destructive" : "border-input")}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">You can use the same username across your profiles or choose unique ones.</p>
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-primary text-primary-foreground font-semibold"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
            {current < count ? "Next Profile" : "Finish Setup"} <CheckCircle2 className="w-4 h-4" />
          </>}
        </button>
      </form>
    </div>
  );
}

export default function SignupProfilesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <SignupProfilesContent />
    </Suspense>
  );
}
