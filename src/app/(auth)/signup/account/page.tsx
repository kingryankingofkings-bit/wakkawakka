"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const accountSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms of Service to continue",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AccountFormValues = z.infer<typeof accountSchema>;

export default function SignupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profilesCount = searchParams.get("count") || "1";
  
  const { registerAccount } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setServerError(null);
    try {
      // Register the master account and get the account ID or token
      await registerAccount(data.email, data.password);
      
      toast.success("Account credentials saved!");
      // Proceed to the profiles wizard
      router.push(`/signup/profiles?count=${profilesCount}&current=1`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create Master Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Step 2: Set up your login credentials for your {profilesCount} profile{Number(profilesCount) > 1 ? "s" : ""}.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={cn("w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-background", errors.email ? "border-destructive" : "border-input")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={cn("w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-background", errors.password ? "border-destructive" : "border-input")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className={cn("w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-background", errors.confirmPassword ? "border-destructive" : "border-input")}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-start gap-2.5 pt-2">
          <input type="checkbox" {...register("terms")} className="mt-0.5 h-4 w-4 rounded border-input" />
          <label className="text-sm text-muted-foreground cursor-pointer">
            I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link>
          </label>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-primary text-primary-foreground font-semibold mt-4"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue to Profiles <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}
