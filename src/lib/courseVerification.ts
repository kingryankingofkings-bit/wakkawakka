import { User } from "@/types";

export function canCreateCourse(user: User, isPaidCourse: boolean): { allowed: boolean; reason?: string } {
  // Check baseline professional features requirement
  if (user.professionalTier === "NONE") {
    return { allowed: false, reason: "You must upgrade to a professional tier to create courses." };
  }

  if (user.idVerificationStatus !== "VERIFIED") {
    return { allowed: false, reason: "You must complete ID verification to create courses and get the W badge." };
  }

  // Calculate account age in months
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const monthsActive = accountAgeMs / (1000 * 60 * 60 * 24 * 30.44);

  // Define tier limits
  const limits = {
    SIMPLE: { free: 10, paid: 5, paidWaitMonths: 6 },
    BETTER: { free: 15, paid: 10, paidWaitMonths: 6 },
    BEST: { free: Infinity, paid: 20, paidWaitMonths: 6 },
    PURE: { free: Infinity, paid: Infinity, paidWaitMonths: 3 },
  };

  const tierLimits = limits[user.professionalTier as keyof typeof limits];
  if (!tierLimits) {
    return { allowed: false, reason: "Invalid professional tier." };
  }

  if (isPaidCourse) {
    // Check wait time
    if (monthsActive < tierLimits.paidWaitMonths) {
      return { allowed: false, reason: `You must wait ${tierLimits.paidWaitMonths} months before creating paid courses on your current tier.` };
    }
    // Check quota
    if (user.paidCoursesCreatedThisMonth >= tierLimits.paid) {
      return { allowed: false, reason: `You have reached your limit of ${tierLimits.paid} paid courses per month.` };
    }
  } else {
    // Free course
    if (user.freeCoursesCreatedThisMonth >= tierLimits.free) {
      return { allowed: false, reason: `You have reached your limit of ${tierLimits.free} free courses per month.` };
    }
  }

  return { allowed: true };
}
